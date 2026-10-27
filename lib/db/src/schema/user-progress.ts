import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const userProgressTable = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserProgress = typeof userProgressTable.$inferSelect;
