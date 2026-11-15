import { eq } from "drizzle-orm";
import webpush from "web-push";
import {
  db,
  pushReminderSubscriptionsTable,
} from "@workspace/db";
import { logger } from "./logger";
import {
  getDueReminderBatch,
  getActiveSnoozedReminders,
  getDueSnoozedReminders,
  getStoredSnoozedReminders,
  serializeSnoozedReminder,
} from "./reminder-schedule";
import { getOrCreateVapidKeys } from "./vapid";

function getLocalDateTime(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

let dispatchRunning = false;

async function updateSentLocalDates(
  endpointHash: string,
  update: (current: Record<string, string>) => Record<string, string>,
  now: Date,
): Promise<void> {
  const [latest] = await db
    .select({ lastSentLocalDates: pushReminderSubscriptionsTable.lastSentLocalDates })
    .from(pushReminderSubscriptionsTable)
    .where(eq(pushReminderSubscriptionsTable.endpointHash, endpointHash))
    .limit(1);
  if (!latest) return;
  await db
    .update(pushReminderSubscriptionsTable)
    .set({
      lastSentLocalDates: update({ ...(latest.lastSentLocalDates ?? {}) }),
      updatedAt: now,
    })
    .where(eq(pushReminderSubscriptionsTable.endpointHash, endpointHash));
}

export async function sendDueReminders(now = new Date()): Promise<void> {
  if (dispatchRunning) return;
  dispatchRunning = true;

  try {
    const subscriptions = await db.select().from(pushReminderSubscriptionsTable);
    for (const subscription of subscriptions) {
      const local = getLocalDateTime(subscription.timeZone, now);
      const expiredSnoozes = getStoredSnoozedReminders(subscription.lastSentLocalDates)
        .filter((entry) => entry.record.localDate !== local.date);
      if (expiredSnoozes.length > 0) {
        await updateSentLocalDates(
          subscription.endpointHash,
          (current) => {
            expiredSnoozes.forEach((entry) => {
              if (current[entry.key] === entry.rawValue) delete current[entry.key];
            });
            return current;
          },
          now,
        );
      }
    }
    const due = subscriptions.flatMap((subscription) => {
      const local = getLocalDateTime(subscription.timeZone, now);
      const alreadyCheckedInToday = subscription.lastCheckInLocalDate === local.date;
      const currentDaySnoozes = getActiveSnoozedReminders(
        subscription.lastSentLocalDates,
        local.date,
      );
      const snoozedHabitIds = new Set(currentDaySnoozes.map((entry) => entry.record.habitId));
      const schedules = alreadyCheckedInToday ? [] : [
        {
          scheduleId: "global",
          reminderTimes: subscription.reminderTimes.length > 0
            ? subscription.reminderTimes
            : [subscription.reminderTime],
        },
        ...(subscription.habitReminders ?? [])
          .filter((reminder) => !snoozedHabitIds.has(reminder.habitId))
          .map((reminder) => ({
          scheduleId: `habit:${reminder.habitId}`,
          reminderTimes: reminder.reminderTimes,
          habitTitle: reminder.habitTitle,
          restDays: reminder.restDays,
          })),
      ];
      const dueBatch = alreadyCheckedInToday ? null : getDueReminderBatch({
        schedules,
        fallbackReminderTime: subscription.reminderTime,
        localDate: local.date,
        localTime: local.time,
        lastSentLocalDates: subscription.lastSentLocalDates,
        legacyLastSentLocalDate: subscription.lastSentLocalDate,
      });
      const dueSnoozes = getDueSnoozedReminders(
        subscription.lastSentLocalDates,
        local.date,
        now,
        alreadyCheckedInToday,
      );
      return dueBatch || dueSnoozes.length > 0
        ? [{ subscription, local, dueBatch, dueSnoozes }]
        : [];
    });
    if (due.length === 0) return;

    const keys = await getOrCreateVapidKeys();
    webpush.setVapidDetails(
      "mailto:notifications@momentum.app",
      keys.publicKey,
      keys.privateKey,
    );

    for (const item of due) {
      const { subscription, local, dueBatch, dueSnoozes } = item;
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };
        if (dueBatch) {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: `Momentum 打卡提醒 · ${dueBatch.time}`,
              body: dueBatch.habitTitles.length > 0
                ? `現在是「${dueBatch.habitTitles.join('」、「')}」的時間，完成後回來打卡吧。`
                : "今天留一小步給自己，完成目標後回來打卡吧。",
              url: "/today",
            }),
            { TTL: 60 },
          );
          await updateSentLocalDates(
            subscription.endpointHash,
            (current) => {
              dueBatch.keysToMarkSent.forEach((key) => { current[key] = local.date; });
              return current;
            },
            now,
          );
        }
        for (const snooze of dueSnoozes) {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: "Momentum · 稍後提醒",
              body: `現在可以用兩分鐘開始「${snooze.record.habitTitle}」，做到一小步也很好。`,
              url: "/today",
              tag: `momentum-snooze-${subscription.endpointHash.slice(0, 8)}-${snooze.record.habitId.slice(0, 24)}`,
            }),
            { TTL: 60 },
          );
          await updateSentLocalDates(
            subscription.endpointHash,
            (current) => {
              if (current[snooze.key] !== snooze.rawValue) return current;
              current[snooze.key] = serializeSnoozedReminder({
                ...snooze.record,
                status: "sent",
              });
              return current;
            },
            now,
          );
        }
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error
          ? Number(error.statusCode)
          : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await db
            .delete(pushReminderSubscriptionsTable)
            .where(eq(pushReminderSubscriptionsTable.endpointHash, subscription.endpointHash));
        } else {
          logger.warn(
            { endpointHash: subscription.endpointHash, statusCode },
            "Could not deliver daily push reminder",
          );
        }
      }
    }
  } catch (error) {
    logger.error({ err: error }, "Daily push reminder dispatch failed");
  } finally {
    dispatchRunning = false;
  }
}

export function startReminderScheduler(): void {
  const timer = setInterval(() => {
    void sendDueReminders();
  }, 30_000);
  timer.unref();
}
