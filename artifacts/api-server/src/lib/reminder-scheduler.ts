import { and, eq } from "drizzle-orm";
import webpush from "web-push";
import {
  db,
  pushReminderSubscriptionsTable,
} from "@workspace/db";
import { logger } from "./logger";
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

export async function sendDueReminders(now = new Date()): Promise<void> {
  if (dispatchRunning) return;
  dispatchRunning = true;

  try {
    const subscriptions = await db.select().from(pushReminderSubscriptionsTable);
    const due = subscriptions.filter((subscription) => {
      const local = getLocalDateTime(subscription.timeZone, now);
      return local.time >= subscription.reminderTime
        && subscription.lastSentLocalDate !== local.date
        && subscription.lastCheckInLocalDate !== local.date;
    });
    if (due.length === 0) return;

    const keys = await getOrCreateVapidKeys();
    webpush.setVapidDetails(
      "mailto:notifications@momentum.app",
      keys.publicKey,
      keys.privateKey,
    );

    for (const subscription of due) {
      const local = getLocalDateTime(subscription.timeZone, now);
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: "Momentum 打卡時間到啦",
            body: "今天留一小步給自己，完成目標後回來打卡吧。",
            url: "/today",
          }),
          { TTL: 60 },
        );
        await db
          .update(pushReminderSubscriptionsTable)
          .set({ lastSentLocalDate: local.date, updatedAt: now })
          .where(eq(pushReminderSubscriptionsTable.endpointHash, subscription.endpointHash));
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
