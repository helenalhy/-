import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { transform } from "esbuild";

const routePath = path.resolve(import.meta.dirname, "../src/routes/progress.ts");
const routeSource = fs.readFileSync(routePath, "utf8");

function createRouteHarness() {
  const handlers = new Map();
  const records = new Map();
  const userProgressTable = {
    userId: "userId",
    snapshot: "snapshot",
    updatedAt: "updatedAt",
  };
  const router = {
    get(routePath, handler) {
      handlers.set(`GET ${routePath}`, handler);
      return this;
    },
    put(routePath, handler) {
      handlers.set(`PUT ${routePath}`, handler);
      return this;
    },
  };
  const db = {
    select() {
      return {
        from() {
          return {
            where(condition) {
              return {
                async limit() {
                  const record = records.get(condition.value);
                  return record ? [record] : [];
                },
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values(row) {
          return {
            onConflictDoUpdate({ target, set }) {
              assert.equal(target, userProgressTable.userId);
              return {
                async returning() {
                  const record = {
                    userId: row.userId,
                    snapshot: set.snapshot,
                    updatedAt: set.updatedAt,
                  };
                  records.set(row.userId, record);
                  return [record];
                },
              };
            },
          };
        },
      };
    },
  };
  const snapshotSchema = {
    parse(value) {
      return value;
    },
    safeParse(value) {
      const valid = value !== null
        && typeof value === "object"
        && Number.isInteger(value.schemaVersion)
        && Array.isArray(value.habits)
        && value.mall !== null
        && typeof value.mall === "object";
      return valid
        ? { success: true, data: value }
        : { success: false, error: { message: "Invalid progress snapshot" } };
    },
  };
  const fakeRequire = (specifier) => {
    if (specifier === "express") return { Router: () => router };
    if (specifier === "@clerk/express") {
      return { getAuth: (request) => ({ userId: request.authUserId ?? null }) };
    }
    if (specifier === "drizzle-orm") {
      return { eq: (column, value) => ({ column, value }) };
    }
    if (specifier === "@workspace/api-zod") {
      return {
        GetProgressResponse: snapshotSchema,
        SaveProgressBody: snapshotSchema,
        SaveProgressResponse: snapshotSchema,
      };
    }
    if (specifier === "@workspace/db") return { db, userProgressTable };
    throw new Error(`Unexpected route dependency: ${specifier}`);
  };

  return {
    handlers,
    records,
    async loadRouter() {
      const { code } = await transform(routeSource, { loader: "ts", format: "cjs" });
      const routeModule = { exports: {} };
      new Function("require", "module", "exports", code)(
        fakeRequire,
        routeModule,
        routeModule.exports,
      );
      return routeModule.exports.default;
    },
    async request(handler, { userId, body } = {}) {
      const response = { statusCode: 200, body: null };
      const res = {
        status(code) {
          response.statusCode = code;
          return this;
        },
        json(json) {
          response.body = json;
          return this;
        },
      };
      await handler({ authUserId: userId, body }, res);
      return response;
    },
  };
}

test("progress API keeps each signed-in user's snapshot isolated", async () => {
  const harness = createRouteHarness();
  const router = await harness.loadRouter();
  assert.ok(router);
  const getProgress = harness.handlers.get("GET /progress");
  const saveProgress = harness.handlers.get("PUT /progress");
  assert.equal(typeof getProgress, "function");
  assert.equal(typeof saveProgress, "function");

  const guestData = {
    schemaVersion: 1,
    habits: [{
      id: "guest-reading",
      checkIns: ["2026-11-11"],
      stepCheckIns: { "2026-11-11": "read-one-page" },
    }],
    mall: {
      coins: 125,
      purchasedItems: ["shop-strawberry-bakery"],
      rewardedCheckIns: ["guest-reading:2026-11-11"],
      rewardTokens: { facility: 2, shop: 1, decor: 3 },
      placements: { "F1-main-01": "shop-strawberry-bakery" },
      shopInteriors: { "shop-strawberry-bakery": { ownedDecorations: ["bakery-counter"] } },
    },
  };
  const accountData = {
    schemaVersion: 1,
    habits: [{ id: "account-running", checkIns: ["2026-11-10"] }],
    mall: {
      coins: 40,
      purchasedItems: ["facility-fountain"],
      rewardedCheckIns: ["account-running:2026-11-10"],
      rewardTokens: { facility: 0, shop: 1, decor: 0 },
      placements: { "F2-main-01": "facility-fountain" },
      shopInteriors: {},
    },
  };

  assert.equal((await harness.request(saveProgress, { userId: "user-a", body: guestData })).statusCode, 200);
  assert.equal((await harness.request(saveProgress, { userId: "user-b", body: accountData })).statusCode, 200);

  const userA = await harness.request(getProgress, { userId: "user-a" });
  const userB = await harness.request(getProgress, { userId: "user-b" });
  assert.deepEqual(userA.body.snapshot, guestData);
  assert.deepEqual(userB.body.snapshot, accountData);
  assert.notDeepEqual(userA.body.snapshot, userB.body.snapshot);
  assert.deepEqual([...harness.records.keys()].sort(), ["user-a", "user-b"]);
});

test("progress API rejects requests without an authenticated user", async () => {
  const harness = createRouteHarness();
  await harness.loadRouter();
  const getProgress = harness.handlers.get("GET /progress");
  const saveProgress = harness.handlers.get("PUT /progress");
  assert.equal((await harness.request(getProgress)).statusCode, 401);
  assert.equal((await harness.request(saveProgress, { body: { schemaVersion: 1, habits: [], mall: {} } })).statusCode, 401);
  assert.equal(harness.records.size, 0);
});
