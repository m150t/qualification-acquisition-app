import { defineFunction, secret } from "@aws-amplify/backend";

export const sendStudyReminders = defineFunction({
  name: "send-study-reminders",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  schedule: {
    cron: "0 20 * * ? *",
    timezone: "Asia/Tokyo",
    description: "Send QUALog reminders at 20:00 JST",
  },
  environment: {
    VAPID_PUBLIC_KEY: secret("VAPID_PUBLIC_KEY"),
    VAPID_PRIVATE_KEY: secret("VAPID_PRIVATE_KEY"),
    VAPID_SUBJECT: "mailto:support@qua-log.com",
    DDB_ACCESS_KEY_ID: secret("DDB_ACCESS_KEY_ID"),
    DDB_SECRET_ACCESS_KEY: secret("DDB_SECRET_ACCESS_KEY"),
    DDB_REGION: "ap-northeast-1",
  },
});
