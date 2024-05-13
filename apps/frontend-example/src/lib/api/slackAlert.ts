import axios from 'axios';
import env from './env';

export const slackAlert = async (messages: string[]): Promise<void> => {
  if (messages.length === 0) return;
  const res = await sendSingleSlackMessage(messages[0]!);
  for (let i = 1; i < messages.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await sendSingleSlackMessage(messages[i]!, res.ts);
  }
};

const sendSingleSlackMessage = async (message: string, threadTs?: string): Promise<{ ts: string }> => {
  console.log(`Sending Slack (thread: ${threadTs ?? 'none'}): ${message}`);
  return axios({
    method: 'post',
    baseURL: 'https://slack.com/api/',
    url: 'chat.postMessage',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ALERTS_SLACK_BOT_TOKEN}`,
    },
    data: {
      channel: env.ALERTS_SLACK_CHANNEL_ID,
      text: `frontend-example: ${message}`,
      thread_ts: threadTs,
    },
  }).then((res) => {
    if (!res.data.ok) {
      throw new Error(`Error from Slack API: ${res.data.error}`);
    }
    return { ts: res.data.ts };
  });
};
