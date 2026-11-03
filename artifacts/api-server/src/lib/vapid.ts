import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db, pushVapidConfigTable } from "@workspace/db";

const CONFIG_ID = "momentum-web-push-v1";

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

function getEncryptionKey(): Buffer {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 16) {
    throw new Error("SESSION_SECRET is required to protect the push signing key");
  }
  return createHash("sha256").update(sessionSecret).digest();
}

function encryptPrivateKey(privateKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  return {
    encryptedPrivateKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptPrivateKey(record: {
  encryptedPrivateKey: string;
  iv: string;
  authTag: string;
}): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(record.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(record.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(record.encryptedPrivateKey, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getOrCreateVapidKeys(): Promise<VapidKeys> {
  const [existing] = await db
    .select()
    .from(pushVapidConfigTable)
    .where(eq(pushVapidConfigTable.id, CONFIG_ID))
    .limit(1);

  if (existing) {
    return {
      publicKey: existing.publicKey,
      privateKey: decryptPrivateKey(existing),
    };
  }

  const generated = webpush.generateVAPIDKeys();
  const encrypted = encryptPrivateKey(generated.privateKey);
  await db
    .insert(pushVapidConfigTable)
    .values({ id: CONFIG_ID, publicKey: generated.publicKey, ...encrypted })
    .onConflictDoNothing();

  const [saved] = await db
    .select()
    .from(pushVapidConfigTable)
    .where(eq(pushVapidConfigTable.id, CONFIG_ID))
    .limit(1);

  if (!saved) throw new Error("Could not initialize browser push configuration");
  return {
    publicKey: saved.publicKey,
    privateKey: decryptPrivateKey(saved),
  };
}
