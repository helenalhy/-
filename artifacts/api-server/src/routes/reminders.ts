import { createHash } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  DeleteReminderSubscriptionBody,
  DeleteReminderSubscriptionResponse,
  GetReminderConfigResponse,
  SaveReminderSubscriptionBody,
  SaveReminderSubscriptionResponse,
  UpdateReminderCheckInStatusBody,
  UpdateReminderCheckInStatusResponse,
} from "@workspace/api-zod";
import {
  db,
  pushReminderSubscriptionsTable,
} from "@workspace/db";
import { getOrCreateVapidKeys } from "../lib/vapid";

const router: IRouter = Router();

export function hashPushEndpoint(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

function isSupportedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "fcm.googleapis.com"
      || host.endsWith(".push.services.mozilla.com")
      || host === "push.apple.com"
      || host.endsWith(".push.apple.com");
  } catch {
    return false;
  }
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

router.get("/reminders/config", async (_req, res): Promise<void> => {
  try {
    const keys = await getOrCreateVapidKeys();
    res.json(GetReminderConfigResponse.parse({ publicKey: keys.publicKey }));
  } catch {
    res.status(503).json({ error: "Push reminders are not available" });
  }
});

router.put("/reminders/subscription", async (req, res): Promise<void> => {
  const parsed = SaveReminderSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reminder settings" });
    return;
  }

  const { endpoint, p256dh, auth, reminderTimes, timeZone } = parsed.data;
  if (!isSupportedPushEndpoint(endpoint) || !isValidTimeZone(timeZone)) {
    res.status(400).json({ error: "Unsupported push endpoint or time zone" });
    return;
  }
  if (new Set(reminderTimes).size !== reminderTimes.length) {
    res.status(400).json({ error: "Reminder times must be unique" });
    return;
  }
  const normalizedTimes = [...reminderTimes].sort();

  const endpointHash = hashPushEndpoint(endpoint);
  const [saved] = await db
    .insert(pushReminderSubscriptionsTable)
    .values({
      endpointHash,
      endpoint,
      p256dh,
      auth,
      reminderTime: normalizedTimes[0],
      reminderTimes: normalizedTimes,
      timeZone,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pushReminderSubscriptionsTable.endpointHash,
      set: {
        endpoint,
        p256dh,
        auth,
        reminderTimes: normalizedTimes,
        timeZone,
        updatedAt: new Date(),
      },
    })
    .returning();

  res.json(
    SaveReminderSubscriptionResponse.parse({
      enabled: true,
      reminderTimes: saved.reminderTimes.length > 0 ? saved.reminderTimes : [saved.reminderTime],
      timeZone: saved.timeZone,
    }),
  );
});

router.post("/reminders/subscription", async (req, res): Promise<void> => {
  const parsed = DeleteReminderSubscriptionBody.safeParse(req.body);
  if (!parsed.success || !isSupportedPushEndpoint(parsed.data?.endpoint ?? "")) {
    res.status(400).json({ error: "Invalid push endpoint" });
    return;
  }

  await db
    .delete(pushReminderSubscriptionsTable)
    .where(
      eq(
        pushReminderSubscriptionsTable.endpointHash,
        hashPushEndpoint(parsed.data.endpoint),
      ),
    );
  res.json(DeleteReminderSubscriptionResponse.parse({ enabled: false }));
});

router.put("/reminders/check-in", async (req, res): Promise<void> => {
  const parsed = UpdateReminderCheckInStatusBody.safeParse(req.body);
  if (!parsed.success || !isSupportedPushEndpoint(parsed.data?.endpoint ?? "")) {
    res.status(400).json({ error: "Invalid reminder status" });
    return;
  }

  const endpointHash = hashPushEndpoint(parsed.data.endpoint);
  const [subscription] = await db
    .select({
      timeZone: pushReminderSubscriptionsTable.timeZone,
    })
    .from(pushReminderSubscriptionsTable)
    .where(eq(pushReminderSubscriptionsTable.endpointHash, endpointHash))
    .limit(1);

  if (subscription) {
    const localDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: subscription.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await db
      .update(pushReminderSubscriptionsTable)
      .set({
        lastCheckInLocalDate: parsed.data.hasCheckedInToday ? localDate : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pushReminderSubscriptionsTable.endpointHash, endpointHash),
          eq(pushReminderSubscriptionsTable.timeZone, subscription.timeZone),
        ),
      );
  }

  res.json(UpdateReminderCheckInStatusResponse.parse({ enabled: Boolean(subscription) }));
});

export default router;
