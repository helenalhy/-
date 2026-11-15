import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const pushReminderSubscriptionsTable = pgTable(
  "push_reminder_subscriptions",
  {
    endpointHash: text("endpoint_hash").primaryKey(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    reminderTime: text("reminder_time").notNull(),
    reminderTimes: jsonb("reminder_times")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    habitReminders: jsonb("habit_reminders")
      .$type<Array<{
        habitId: string;
        habitTitle: string;
        reminderTimes: string[];
        restDays?: number[];
      }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    timeZone: text("time_zone").notNull(),
    lastSentLocalDate: text("last_sent_local_date"),
    lastSentLocalDates: jsonb("last_sent_local_dates")
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    lastCheckInLocalDate: text("last_check_in_local_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const pushVapidConfigTable = pgTable("push_vapid_config", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PushReminderSubscription =
  typeof pushReminderSubscriptionsTable.$inferSelect;
