import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "./prisma-client";

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return null;
  }

  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
}

export async function registerPushToken(token: string, userId: string | null) {
  await prisma.pushToken.upsert({
    where: { token },
    create: { token, userId },
    update: { userId }
  });
}

export async function unregisterPushToken(token: string) {
  await prisma.pushToken.deleteMany({ where: { token } });
}

// Targeted send (as opposed to broadcastPushNotification's site-wide blast)
// — used for per-user activity notifications like "X changed your trip".
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const app = getFirebaseApp();
  if (!app) return;

  const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { id: true, token: true } });
  if (tokens.length === 0) return;

  const messaging = getMessaging(app);
  const response = await messaging.sendEachForMulticast({
    tokens: tokens.map((entry) => entry.token),
    notification: { title, body },
    ...(data ? { data } : {})
  });

  const staleTokenIds = response.responses
    .map((result, index) =>
      !result.success &&
      (result.error?.code === "messaging/registration-token-not-registered" ||
        result.error?.code === "messaging/invalid-registration-token")
        ? tokens[index]!.id
        : null
    )
    .filter((id): id is string => id !== null);

  if (staleTokenIds.length > 0) {
    await prisma.pushToken.deleteMany({ where: { id: { in: staleTokenIds } } });
  }
}

export type BroadcastResult = {
  sent: number;
  failed: number;
  totalTokens: number;
};

export async function broadcastPushNotification(title: string, body: string): Promise<BroadcastResult> {
  const app = getFirebaseApp();
  if (!app) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  }

  const tokens = await prisma.pushToken.findMany({ select: { id: true, token: true } });
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, totalTokens: 0 };
  }

  const messaging = getMessaging(app);
  const BATCH_SIZE = 500;
  let sent = 0;
  let failed = 0;
  const staleTokenIds: string[] = [];

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    const response = await messaging.sendEachForMulticast({
      tokens: batch.map((entry) => entry.token),
      notification: { title, body }
    });

    sent += response.successCount;
    failed += response.failureCount;

    response.responses.forEach((result, index) => {
      if (
        !result.success &&
        (result.error?.code === "messaging/registration-token-not-registered" ||
          result.error?.code === "messaging/invalid-registration-token")
      ) {
        staleTokenIds.push(batch[index]!.id);
      }
    });
  }

  if (staleTokenIds.length > 0) {
    await prisma.pushToken.deleteMany({ where: { id: { in: staleTokenIds } } });
  }

  return { sent, failed, totalTokens: tokens.length };
}
