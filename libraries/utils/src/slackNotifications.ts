type SlackAlertEnv = {
  APP_NAME: string;
  ALERTS_SLACK_BOT_TOKEN: string;
  ALERTS_SLACK_CHANNEL_ID: string;
  INFO_SLACK_CHANNEL_ID: string;
};

export const slackAlert = async (env: SlackAlertEnv, messages: string[], level?: 'error' | 'info'): Promise<void> => {
  if (messages.length === 0) return;

  try {
    const res = await sendSingleSlackMessage(env, messages[0]!, level);
    for (let i = 1; i < messages.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await sendSingleSlackMessage(env, messages[i]!, level, res.ts);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending Slack alert:', error);
  }
};

const sendSingleSlackMessage = async (env: SlackAlertEnv, message: string, level?: 'error' | 'info', threadTs?: string): Promise<{ ts: string }> => {
  // By default we send to the alerts channel if no explicit channel is provided
  const channel = !level || level === 'error' ? env.ALERTS_SLACK_CHANNEL_ID : env.INFO_SLACK_CHANNEL_ID;

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ALERTS_SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel,
      text: `${env.APP_NAME}: ${message}`,
      thread_ts: threadTs,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Error from Slack API: ${data.error || response.statusText}`);
  }

  return { ts: data.ts };
};
