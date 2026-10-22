// The First Contact Slack app: reads who's in #welcome and posts each new hire's chats there.

const SLACK_API = 'https://slack.com/api';
const STAFF_EMAIL_DOMAIN = 'bluedot.org';
const USERS_INFO_BATCH = 10;

export type ChannelTeammate = {
  slackUserId: string;
  name: string;
  email: string;
  timeZone: string;
};

type SlackUser = {
  id: string;
  deleted?: boolean;
  is_bot?: boolean;
  real_name?: string;
  tz?: string;
  profile?: { email?: string; real_name?: string; display_name?: string };
};

export class FirstContactSlack {
  constructor(private readonly token: string, private readonly channelId: string) {}

  private async call<T>(method: string, params: Record<string, string>, init?: { post: unknown }): Promise<T> {
    const response = init
      ? await fetch(`${SLACK_API}/${method}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(init.post),
      })
      : await fetch(`${SLACK_API}/${method}?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${this.token}` } });
    const body = await response.json() as { ok: boolean; error?: string } & T;
    // Slack answers HTTP 200 with ok:false for most failures
    if (!body.ok) throw new Error(`Slack ${method} failed: ${body.error ?? `HTTP ${response.status}`}`);
    return body;
  }

  /** People in the channel with a BlueDot email, leaving out bots and deactivated accounts. */
  async teammates(): Promise<ChannelTeammate[]> {
    const memberIds: string[] = [];
    let cursor = '';
    do {
      // eslint-disable-next-line no-await-in-loop
      const page = await this.call<{ members: string[]; response_metadata?: { next_cursor?: string } }>(
        'conversations.members',
        { channel: this.channelId, limit: '1000', ...(cursor ? { cursor } : {}) },
      );
      memberIds.push(...page.members);
      cursor = page.response_metadata?.next_cursor ?? '';
    } while (cursor);

    // A few at a time, so a big channel doesn't hit Slack's rate limit in one burst
    const users: SlackUser[] = [];
    for (let i = 0; i < memberIds.length; i += USERS_INFO_BATCH) {
      // eslint-disable-next-line no-await-in-loop
      users.push(...await Promise.all(memberIds.slice(i, i + USERS_INFO_BATCH)
        .map(async (user) => (await this.call<{ user: SlackUser }>('users.info', { user })).user)));
    }

    return users.flatMap((user) => {
      const email = user.profile?.email?.toLowerCase();
      if (user.deleted === true || user.is_bot === true || !email?.endsWith(`@${STAFF_EMAIL_DOMAIN}`)) return [];
      return [{
        slackUserId: user.id,
        name: firstNonEmpty(user.profile?.real_name, user.real_name, user.profile?.display_name) ?? email,
        email,
        timeZone: firstNonEmpty(user.tz) ?? 'America/Los_Angeles',
      }];
    });
  }

  async post({ text }: { text: string }): Promise<void> {
    await this.call('chat.postMessage', {}, { post: { channel: this.channelId, text, unfurl_links: false } });
  }
}

// Slack sends empty strings for unset profile fields
function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  return values.find((value) => value?.trim());
}
