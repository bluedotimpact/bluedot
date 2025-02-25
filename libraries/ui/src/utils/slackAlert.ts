import axios from 'axios';

export type SlackAlertEnv = {
  APP_NAME: string;
  ALERTS_SLACK_BOT_TOKEN: string;
  ALERTS_SLACK_CHANNEL_ID: string;
};

export const slackAlert = async (env: SlackAlertEnv, messages: string[]): Promise<void> => {
  if (messages.length === 0) return;
  const res = await sendSingleSlackMessage(env, messages[0]!);
  for (let i = 1; i < messages.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await sendSingleSlackMessage(env, messages[i]!, res.ts);
  }
};

const sendSingleSlackMessage = async (env: SlackAlertEnv, message: string, threadTs?: string): Promise<{ ts: string }> => {
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
      text: `${env.APP_NAME}: ${message}`,
      thread_ts: threadTs,
    },
  }).then((res) => {
    if (!res.data.ok) {
      throw new Error(`Error from Slack API: ${res.data.error}`);
    }
    return { ts: res.data.ts };
  });
};
