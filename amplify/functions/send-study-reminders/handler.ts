import { createCipheriv, createECDH, createPrivateKey, createSign, hkdfSync, randomBytes } from "node:crypto";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

type Subscription = {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type Goal = {
  userId: string;
  plan?: Array<{ date?: string; topics?: string[]; tasks?: string[] }>;
  pushSubscriptions?: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>;
};

type Report = {
  studyTime?: number | null;
  tasksCompleted?: number | null;
  taskStatuses?: Record<string, boolean> | null;
};

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.DDB_REGION,
  credentials: process.env.DDB_ACCESS_KEY_ID && process.env.DDB_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.DDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.DDB_SECRET_ACCESS_KEY,
  } : undefined,
}));
const goalsTable = process.env.DDB_GOALS_TABLE ?? "StudyGoals";
const reportsTable = process.env.DDB_REPORTS_TABLE ?? "StudyReports";

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function toBase64Url(value: Buffer): string {
  return value.toString("base64url");
}

function dateKey(date: Date): string {
  // Lambdaの実行環境はUTCのため、判定対象の日付は必ず日本時間へ変換する。
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function previousDate(date: Date, days: number): string {
  return dateKey(new Date(date.getTime() - days * 86_400_000));
}

function hasTasks(goal: Goal, date: string): boolean {
  const day = goal.plan?.find((item) => item.date === date);
  return Boolean(day && ((day.topics?.length ?? 0) > 0 || (day.tasks?.length ?? 0) > 0));
}

function isCompleted(report: Report): boolean {
  // 学習時間だけでなく、タスク単位で記録した場合も「実施済み」として扱う。
  return (
    (report.studyTime ?? 0) > 0 ||
    (report.tasksCompleted ?? 0) > 0 ||
    Object.values(report.taskStatuses ?? {}).some(Boolean)
  );
}

async function completedOn(userId: string, date: string): Promise<boolean> {
  const result = await ddb.send(new QueryCommand({
    TableName: reportsTable,
    KeyConditionExpression: "userId = :userId AND begins_with(#date, :date)",
    ExpressionAttributeNames: { "#date": "date" },
    ExpressionAttributeValues: { ":userId": userId, ":date": `${date}#` },
  }));
  return (result.Items ?? []).some((item) => isCompleted(item as Report));
}

function vapidAuthorization(endpoint: string, publicKey: string, privateKey: string): string {
  // Push配信先ごとのオリジンをaudienceに指定した短命なVAPID JWTを生成する。
  const audience = new URL(endpoint).origin;
  const publicBytes = fromBase64Url(publicKey);
  const x = publicBytes.subarray(1, 33);
  const y = publicBytes.subarray(33, 65);
  const key = createPrivateKey({
    key: { kty: "EC", crv: "P-256", x: toBase64Url(x), y: toBase64Url(y), d: toBase64Url(fromBase64Url(privateKey)) },
    format: "jwk",
  });
  const header = toBase64Url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = toBase64Url(Buffer.from(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: process.env.VAPID_SUBJECT,
  })));
  const signer = createSign("SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign({ key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${header}.${payload}.${toBase64Url(signature)}, k=${publicKey}`;
}

function encryptPayload(subscription: Subscription, payload: string): Buffer {
  // RFC 8291のaes128gcm形式で、購読ブラウザだけが復号できる本文を生成する。
  const userPublicKey = fromBase64Url(subscription.p256dh);
  const authSecret = fromBase64Url(subscription.auth);
  const server = createECDH("prime256v1");
  server.generateKeys();
  const serverPublicKey = server.getPublicKey();
  const sharedSecret = server.computeSecret(userPublicKey);
  const info = Buffer.concat([Buffer.from("WebPush: info\0"), userPublicKey, serverPublicKey]);
  const ikm = Buffer.from(hkdfSync("sha256", sharedSecret, authSecret, info, 32));
  const salt = randomBytes(16);
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const encrypted = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  return Buffer.concat([salt, recordSize, Buffer.from([serverPublicKey.length]), serverPublicKey, encrypted]);
}

async function sendPush(subscription: Subscription, payload: object): Promise<Response> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("VAPID keys are not configured");
  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidAuthorization(subscription.endpoint, publicKey, privateKey),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body: encryptPayload(subscription, JSON.stringify(payload)).buffer as ArrayBuffer,
  });
}

export const handler = async (): Promise<{ sent: number; removed: number }> => {
  // 通知設定は目標アイテムに保持しているため、目標と購読情報を一度に取得する。
  const scan = await ddb.send(new ScanCommand({ TableName: goalsTable }));
  const goals = (scan.Items ?? []) as Goal[];
  const now = new Date();
  let sent = 0;
  let removed = 0;

  for (const goal of goals) {
    const today = previousDate(now, 0);
    if (!hasTasks(goal, today) || await completedOn(goal.userId, today)) continue;

    // 「3回連続」は、今日を含む3暦日すべてに予定があり、実績がない場合とする。
    const missedThree = (await Promise.all([0, 1, 2].map(async (days) => {
      const date = previousDate(now, days);
      return hasTasks(goal, date) && !(await completedOn(goal.userId, date));
    }))).every(Boolean);
    const payload = missedThree
      ? { title: "計画を見直してみませんか？", body: "3日続けてタスクが未実施です。無理のない計画に整えましょう。", url: "/goal" }
      : { title: "今日のタスクが残っています", body: "少しだけでも大丈夫。今日の学習を記録しましょう。", url: "/home" };
    const activeSubscriptions: NonNullable<Goal["pushSubscriptions"]> = [];
    for (const stored of goal.pushSubscriptions ?? []) {
      const subscription: Subscription = { userId: goal.userId, endpoint: stored.endpoint, ...stored.keys };
      const response = await sendPush(subscription, payload);
      if (response.ok) sent += 1;
      if (response.status === 404 || response.status === 410) removed += 1;
      else activeSubscriptions.push(stored);
    }
    // 失効済みの購読を残すと毎日失敗するため、配信先から404/410が返ったものを除去する。
    if (activeSubscriptions.length !== (goal.pushSubscriptions?.length ?? 0)) {
      await ddb.send(new UpdateCommand({
        TableName: goalsTable,
        Key: { userId: goal.userId },
        UpdateExpression: "SET pushSubscriptions = :subscriptions",
        ExpressionAttributeValues: { ":subscriptions": activeSubscriptions },
      }));
    }
  }
  return { sent, removed };
};
