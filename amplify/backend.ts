import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { sendStudyReminders } from './functions/send-study-reminders/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  sendStudyReminders,
});
