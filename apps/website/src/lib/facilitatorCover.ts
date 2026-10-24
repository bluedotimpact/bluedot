import { MINUTES_IN_UNIT, MINUTES_IN_WEEK, utcIntervalStringToGrid } from '@bluedot/utils';

export const MAX_TAGGED_FACILITATORS = 5;

const MINUTES_IN_DAY = 24 * 60;

export type SlackPerson = { name: string; slackUserId: string | null };

export type CoverMessageSegment =
  | { type: 'text'; text: string }
  // Rendered bold in the reader's time zone, followed by the UTC range in brackets
  | { type: 'time'; startTimeSeconds: number; endTimeSeconds: number }
  | { type: 'mention'; name: string; slackUserId: string | null }
  | { type: 'link'; text: string; url: string };

export type CoverMessageDetails = {
  requester: SlackPerson;
  courseTitle: string;
  unitNumber: string | null;
  groupName: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  /** Tagged facilitators whose availability covers the discussion */
  availableFacilitators: SlackPerson[];
  /** Tagged facilitators with no clashing discussion, whose availability doesn't cover it */
  noClashFacilitators: SlackPerson[];
  moreAvailableThanTagged: boolean;
  assignUrl: string;
};

/** Slack member id from a profile URL like https://aisafetyfundamentals.slack.com/team/U0123ABCD */
export const slackUserIdFromProfileUrl = (url: string | null): string | null => url?.match(/\/team\/([A-Z0-9]+)\/?$/)?.[1] ?? null;

/** Whether a weekly availability (UTC, 30-minute slots) covers the whole of [start, end) */
export const isAvailableThroughout = ({ availabilityIntervalsUTC, startTimeSeconds, endTimeSeconds }: {
  availabilityIntervalsUTC: string | null;
  startTimeSeconds: number;
  endTimeSeconds: number;
}): boolean => {
  if (!availabilityIntervalsUTC) return false;

  let grid: Record<number, boolean>;
  try {
    grid = utcIntervalStringToGrid(availabilityIntervalsUTC, 'UTC00:00');
  } catch {
    return false;
  }

  const start = new Date(startTimeSeconds * 1000);
  const startMinuteOfWeek = ((start.getUTCDay() + 6) % 7) * MINUTES_IN_DAY + start.getUTCHours() * 60 + start.getUTCMinutes();
  const endMinute = startMinuteOfWeek + (endTimeSeconds - startTimeSeconds) / 60;
  for (let slot = Math.floor(startMinuteOfWeek / MINUTES_IN_UNIT) * MINUTES_IN_UNIT; slot < endMinute; slot += MINUTES_IN_UNIT) {
    if (!grid[slot % MINUTES_IN_WEEK]) return false;
  }

  return true;
};

/** Up to MAX_TAGGED_FACILITATORS, in the order given: available facilitators first, topped up with ones who just have no clash */
export const pickFacilitatorsToTag = <T>({ available, noClash }: { available: T[]; noClash: T[] }): { available: T[]; noClash: T[] } => {
  const pickedAvailable = available.slice(0, MAX_TAGGED_FACILITATORS);
  return { available: pickedAvailable, noClash: noClash.slice(0, MAX_TAGGED_FACILITATORS - pickedAvailable.length) };
};

const getTimeParts = ({ startTimeSeconds, endTimeSeconds, timeZone }: {
  startTimeSeconds: number;
  endTimeSeconds: number;
  timeZone: string;
}) => {
  const start = new Date(startTimeSeconds * 1000);
  const formatTime = (date: Date) => new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(date);
  return {
    date: new Intl.DateTimeFormat('en-GB', {
      timeZone, weekday: 'short', day: 'numeric', month: 'short',
    }).format(start).replace(',', ''),
    startTime: formatTime(start),
    endTime: formatTime(new Date(endTimeSeconds * 1000)),
    zone: new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'short' })
      .formatToParts(start).find((part) => part.type === 'timeZoneName')?.value ?? timeZone,
  };
};

/** The reader's local time, e.g. "Fri 23 Oct, 08:00–10:00" */
export const formatCoverTimeLocal = ({ startTimeSeconds, endTimeSeconds, timeZone = 'UTC' }: {
  startTimeSeconds: number;
  endTimeSeconds: number;
  timeZone?: string;
}): string => {
  const { date, startTime, endTime } = getTimeParts({ startTimeSeconds, endTimeSeconds, timeZone });
  return `${date}, ${startTime}–${endTime}`;
};

/** The UTC range shown after a local time, e.g. "(07:00–09:00 UTC)"; the date is added when the local date differs */
export const formatCoverTimeUtcBracket = ({ startTimeSeconds, endTimeSeconds, timeZone }: {
  startTimeSeconds: number;
  endTimeSeconds: number;
  timeZone: string;
}): string => {
  const utc = getTimeParts({ startTimeSeconds, endTimeSeconds, timeZone: 'UTC' });
  const local = getTimeParts({ startTimeSeconds, endTimeSeconds, timeZone });
  return `(${utc.date === local.date ? '' : `${utc.date}, `}${utc.startTime}–${utc.endTime} ${utc.zone})`;
};

const mentionSegments = (people: SlackPerson[]): CoverMessageSegment[] => people.flatMap((person, i): CoverMessageSegment[] => [
  ...(i > 0 ? [{ type: 'text' as const, text: ' ' }] : []),
  { type: 'mention', ...person },
]);

/** The post as paragraphs of segments, so the site preview and the Slack post share one structure */
export const buildCoverMessage = ({ note, ...details }: CoverMessageDetails & { note?: string }): CoverMessageSegment[][] => {
  const requester: CoverMessageSegment = { type: 'mention', ...details.requester };
  const subject = [details.courseTitle, details.unitNumber ? `Unit ${details.unitNumber}` : null, details.groupName]
    .filter(Boolean)
    .join(' · ');
  const trimmedNote = note?.trim();

  const introParagraph: CoverMessageSegment[] = [
    requester,
    { type: 'text', text: ` is looking for cover for "${subject}" on ` },
    { type: 'time', startTimeSeconds: details.startTimeSeconds, endTimeSeconds: details.endTimeSeconds },
    { type: 'text', text: '.' },
    ...(trimmedNote ? [{ type: 'text' as const, text: ` Note from them: "${trimmedNote}"` }] : []),
  ];

  const { availableFacilitators: available, noClashFacilitators: noClash } = details;
  const availableFacilitatorsIntro: CoverMessageSegment = {
    type: 'text',
    text: `Facilitators free at that time according to their availability${details.moreAvailableThanTagged
      ? ` (more than ${MAX_TAGGED_FACILITATORS} were free, so ${MAX_TAGGED_FACILITATORS} were picked at random)`
      : ''}: `,
  };
  let tagParagraph: CoverMessageSegment[];
  if (available.length > 0 && noClash.length > 0) {
    tagParagraph = [
      availableFacilitatorsIntro,
      ...mentionSegments(available),
      { type: 'text', text: '. Others with no clashing session: ' },
      ...mentionSegments(noClash),
      { type: 'text', text: '.' },
    ];
  } else if (available.length > 0) {
    tagParagraph = [availableFacilitatorsIntro, ...mentionSegments(available)];
  } else if (noClash.length > 0) {
    tagParagraph = [
      { type: 'text', text: 'Nobody\'s availability matches that time, but these facilitators have no clashing session: ' },
      ...mentionSegments(noClash),
    ];
  } else {
    tagParagraph = [{ type: 'text', text: 'Nobody in this round is free at that time, so no one is tagged.' }];
  }

  const callToActionParagraph: CoverMessageSegment[] = [
    { type: 'text', text: 'If you can cover, please reply in this thread. You can reply even if you are not tagged above, as long as you\'ve facilitated this course recently! ' },
    requester,
    { type: 'text', text: ' can then go ' },
    { type: 'link', text: 'here', url: details.assignUrl },
    { type: 'text', text: ' to assign you as a substitute.' },
  ];

  return [introParagraph, tagParagraph, callToActionParagraph];
};

const escapeSlack = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Slack date tokens show each reader their local time; the bracketed UTC range is a fixed reference shown alongside */
const toSlackTime = ({ startTimeSeconds, endTimeSeconds }: { startTimeSeconds: number; endTimeSeconds: number }) => {
  const {
    date, startTime, endTime, zone,
  } = getTimeParts({ startTimeSeconds, endTimeSeconds, timeZone: 'UTC' });
  return `*<!date^${startTimeSeconds}^{date_short_pretty} {time}|${date}, ${startTime}>–<!date^${endTimeSeconds}^{time}|${endTime} ${zone}>* (${startTime}–${endTime} ${zone})`;
};

export const toSlackMrkdwn = (paragraphs: CoverMessageSegment[][]): string => paragraphs
  .map((segments) => segments.map((segment) => {
    switch (segment.type) {
      case 'text': return escapeSlack(segment.text);
      case 'time': return toSlackTime(segment);
      case 'mention': return segment.slackUserId ? `<@${segment.slackUserId}>` : escapeSlack(segment.name);
      case 'link': return `<${segment.url}|${escapeSlack(segment.text)}>`;
      default: return '';
    }
  }).join(''))
  .join('\n\n');
