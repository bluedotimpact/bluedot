import { describe, expect, test } from 'vitest';
import {
  buildCoverMessage,
  formatCoverTimeLocal,
  formatCoverTimeUtcBracket,
  isAvailableThroughout,
  pickFacilitatorsToTag,
  slackUserIdFromProfileUrl,
  toSlackMrkdwn,
  type CoverMessageDetails,
} from './facilitatorCover';

// Friday 23 Oct 2026, 07:00 UTC
const FRI_0700_SECONDS = Date.UTC(2026, 9, 23, 7, 0) / 1000;
const HOUR_SECONDS = 60 * 60;

describe('isAvailableThroughout', () => {
  const discussion = { startTimeSeconds: FRI_0700_SECONDS, endTimeSeconds: FRI_0700_SECONDS + 2 * HOUR_SECONDS };

  test('available when the availability covers the whole discussion', () => {
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'F06:00 F10:00', ...discussion })).toBe(true);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'M10:00 M12:00, F07:00 F09:00', ...discussion })).toBe(true);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'F07:00 F08:00, F08:00 F09:00', ...discussion })).toBe(true);
  });

  test('not available when only part of the discussion is covered', () => {
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'F07:00 F08:30', ...discussion })).toBe(false);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'F07:30 F12:00', ...discussion })).toBe(false);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'F07:00 F08:00, F08:30 F09:00', ...discussion })).toBe(false);
  });

  test('a discussion off the half hour needs every slot it partly overlaps', () => {
    const offset = { startTimeSeconds: FRI_0700_SECONDS + 15 * 60, endTimeSeconds: FRI_0700_SECONDS + 75 * 60 };
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'F07:00 F08:30', ...offset })).toBe(true);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'F07:30 F08:30', ...offset })).toBe(false);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'F07:00 F08:00', ...offset })).toBe(false);
  });

  test('wraps from Sunday night into Monday morning', () => {
    const sundayNight = Date.UTC(2026, 9, 25, 23, 30) / 1000;
    const range = { startTimeSeconds: sundayNight, endTimeSeconds: sundayNight + HOUR_SECONDS };
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'M00:00 M00:30, U23:30 M00:00', ...range })).toBe(true);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'U23:30 M00:00', ...range })).toBe(false);
  });

  test('not available with missing or malformed availability', () => {
    expect(isAvailableThroughout({ availabilityIntervalsUTC: null, ...discussion })).toBe(false);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: '', ...discussion })).toBe(false);
    expect(isAvailableThroughout({ availabilityIntervalsUTC: 'not an interval', ...discussion })).toBe(false);
  });
});

describe('pickFacilitatorsToTag', () => {
  test('tags everyone when there are 5 or fewer', () => {
    expect(pickFacilitatorsToTag({ available: ['a', 'b'], noClash: ['c'] })).toEqual({ available: ['a', 'b'], noClash: ['c'] });
  });

  test('tags the first 5 available facilitators and nobody else when more than 5 are available', () => {
    const picked = pickFacilitatorsToTag({ available: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], noClash: ['x'] });
    expect(picked).toEqual({ available: ['a', 'b', 'c', 'd', 'e'], noClash: [] });
  });

  test('tops up with facilitators who have no clash', () => {
    const picked = pickFacilitatorsToTag({ available: ['a', 'b'], noClash: ['w', 'x', 'y', 'z'] });
    expect(picked).toEqual({ available: ['a', 'b'], noClash: ['w', 'x', 'y'] });
  });
});

describe('slackUserIdFromProfileUrl', () => {
  test('reads the member id from a profile URL', () => {
    expect(slackUserIdFromProfileUrl('https://aisafetyfundamentals.slack.com/team/U0123ABCD')).toBe('U0123ABCD');
    expect(slackUserIdFromProfileUrl('https://aisafetyfundamentals.slack.com/team/U0123ABCD/')).toBe('U0123ABCD');
    expect(slackUserIdFromProfileUrl('https://example.com/profile')).toBeNull();
    expect(slackUserIdFromProfileUrl(null)).toBeNull();
  });
});

describe('formatCoverTimeLocal', () => {
  const range = { startTimeSeconds: FRI_0700_SECONDS, endTimeSeconds: FRI_0700_SECONDS + 2 * HOUR_SECONDS };

  test('shows the date and time in the given time zone, without a zone label', () => {
    expect(formatCoverTimeLocal({ ...range, timeZone: 'Europe/London' })).toBe('Fri 23 Oct, 08:00–10:00');
    expect(formatCoverTimeLocal(range)).toBe('Fri 23 Oct, 07:00–09:00');
  });
});

describe('formatCoverTimeUtcBracket', () => {
  test('omits the date unless the local date differs from the UTC date', () => {
    const morning = { startTimeSeconds: FRI_0700_SECONDS, endTimeSeconds: FRI_0700_SECONDS + 2 * HOUR_SECONDS };
    expect(formatCoverTimeUtcBracket({ ...morning, timeZone: 'Europe/London' })).toBe('(07:00–09:00 UTC)');
    const lateEvening = { startTimeSeconds: FRI_0700_SECONDS + 16 * HOUR_SECONDS, endTimeSeconds: FRI_0700_SECONDS + 17 * HOUR_SECONDS };
    expect(formatCoverTimeUtcBracket({ ...lateEvening, timeZone: 'Pacific/Auckland' })).toBe('(Fri 23 Oct, 23:00–00:00 UTC)');
  });
});

describe('buildCoverMessage + toSlackMrkdwn', () => {
  const details: CoverMessageDetails = {
    requester: { name: 'Sam Rivera', slackUserId: 'UREQ' },
    courseTitle: 'AGI Strategy',
    unitNumber: '4',
    groupName: 'Group 14 - Sam Rivera',
    startTimeSeconds: FRI_0700_SECONDS,
    endTimeSeconds: FRI_0700_SECONDS + 2 * HOUR_SECONDS,
    availableFacilitators: [{ name: 'Ada', slackUserId: 'UADA' }, { name: 'Bo', slackUserId: 'UBO' }],
    noClashFacilitators: [],
    moreAvailableThanTagged: false,
    assignUrl: 'https://bluedot.org/facilitated-courses?changeFacilitator=disc-1',
  };
  const time = '*<!date^1792738800^{date_short_pretty} {time}|Fri 23 Oct, 07:00>–<!date^1792746000^{time}|09:00 UTC>* (07:00–09:00 UTC)';
  const callToAction = 'If you can cover, please reply in this thread. You can reply even if you are not tagged above, as long as you\'ve facilitated this course recently! '
    + '<@UREQ> can then go <https://bluedot.org/facilitated-courses?changeFacilitator=disc-1|here> to assign you as a substitute.';

  test('renders the whole post for Slack', () => {
    expect(toSlackMrkdwn(buildCoverMessage({ ...details, note: '  Back from holiday late  ' }))).toBe([
      `<@UREQ> is looking for cover for "AGI Strategy · Unit 4 · Group 14 - Sam Rivera" on ${time}. Note from them: "Back from holiday late"`,
      'Facilitators free at that time according to their availability: <@UADA> <@UBO>',
      callToAction,
    ].join('\n\n'));
  });

  test('leaves out the note when it is blank', () => {
    expect(toSlackMrkdwn(buildCoverMessage({ ...details, note: '  ' })).split('\n\n')[0]).toBe(`<@UREQ> is looking for cover for "AGI Strategy · Unit 4 · Group 14 - Sam Rivera" on ${time}.`);
  });

  test('words the tags by who was found', () => {
    const tagLine = (overrides: Partial<CoverMessageDetails>) => toSlackMrkdwn(buildCoverMessage({ ...details, ...overrides })).split('\n\n')[1];
    const others = [{ name: 'Cy', slackUserId: 'UCY' }];

    expect(tagLine({ moreAvailableThanTagged: true }))
      .toBe('Facilitators free at that time according to their availability (more than 5 were free, so 5 were picked at random): <@UADA> <@UBO>');
    expect(tagLine({ noClashFacilitators: others }))
      .toBe('Facilitators free at that time according to their availability: <@UADA> <@UBO>. Others with no clashing session: <@UCY>.');
    expect(tagLine({ availableFacilitators: [], noClashFacilitators: others }))
      .toBe('Nobody\'s availability matches that time, but these facilitators have no clashing session: <@UCY>');
    expect(tagLine({ availableFacilitators: [] }))
      .toBe('Nobody in this round is free at that time, so no one is tagged.');
  });

  test('escapes text, and names people with no Slack id', () => {
    const mrkdwn = toSlackMrkdwn(buildCoverMessage({
      ...details, requester: { name: 'Sam <&>', slackUserId: null }, unitNumber: null, note: 'Use <!channel> & co',
    }));
    expect(mrkdwn).toContain('Sam &lt;&amp;&gt; is looking for cover for "AGI Strategy · Group 14 - Sam Rivera" on ');
    expect(mrkdwn).toContain('Note from them: "Use &lt;!channel&gt; &amp; co"');
  });
});
