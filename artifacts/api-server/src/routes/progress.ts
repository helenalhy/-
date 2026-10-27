import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import {
  GetProgressResponse,
  SaveProgressBody,
  SaveProgressResponse,
} from "@workspace/api-zod";
import { db, userProgressTable } from "@workspace/db";

const router: IRouter = Router();
const EMPTY_SNAPSHOT = { schemaVersion: 1, habits: [], mall: {} };

router.get("/progress", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [record] = await db
    .select()
    .from(userProgressTable)
    .where(eq(userProgressTable.userId, userId))
    .limit(1);

  res.json(
    GetProgressResponse.parse({
      exists: Boolean(record),
      snapshot: record?.snapshot ?? EMPTY_SNAPSHOT,
      updatedAt: record?.updatedAt.toISOString() ?? null,
    }),
  );
});

router.put("/progress", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const parsed = SaveProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db
    .insert(userProgressTable)
    .values({ userId, snapshot: parsed.data })
    .onConflictDoUpdate({
      target: userProgressTable.userId,
      set: { snapshot: parsed.data, updatedAt: new Date() },
    })
    .returning();

  res.json(
    SaveProgressResponse.parse({
      exists: true,
      snapshot: record.snapshot,
      updatedAt: record.updatedAt.toISOString(),
    }),
  );
});

export default router;
