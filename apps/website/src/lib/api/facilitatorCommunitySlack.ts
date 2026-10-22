import { logger } from '@bluedot/ui/src/api';
import { TRPCError } from '@trpc/server';
import env from './env';

const SLACK_API = 'https://slack.com/api';

const callSlack = async <T>(response: Promise<Response>, method: string): Promise<T> => {
  const body = await (await response).json() as { ok: boolean; error?: string } & T;
  // Slack answers HTTP 200 with ok:false for most failures
  if (!body.ok) throw new Error(`Slack ${method} failed: ${body.error ?? 'unknown error'}`);
  return body;
};

/** Posts to #facilitator-community in the facilitator community Slack, and returns the post's permalink if Slack gives one */
export const postToFacilitatorCommunity = async ({ mrkdwn }: { mrkdwn: string }): Promise<{ permalink: string | null }> => {
  const token = env.COMMUNITY_SLACK_SUPPORT_BOT_TOKEN;
  const channel = env.FACILITATOR_COMMUNITY_SLACK_CHANNEL_ID;
  if (!token || !channel) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Posting to #facilitator-community is not set up' });
  }

  const { ts } = await callSlack<{ ts: string }>(fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      channel, text: mrkdwn, unfurl_links: false, unfurl_media: false,
    }),
  }), 'chat.postMessage');

  // Never throw once posted, or a retry would post a duplicate
  try {
    // Read methods don't accept JSON bodies
    const { permalink } = await callSlack<{ permalink: string }>(
      fetch(`${SLACK_API}/chat.getPermalink?${new URLSearchParams({ channel, message_ts: ts })}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      'chat.getPermalink',
    );
    return { permalink };
  } catch (error) {
    logger.warn(`[FacilitatorCommunitySlack] Posted message ${ts} but could not get its permalink`, error);
    return { permalink: null };
  }
};
