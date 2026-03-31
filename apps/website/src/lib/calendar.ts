type DiscussionCalendarData = {
  discussionId: string;
  courseTitle?: string | null;
  coursePath?: string | null;
  unitNumber?: number | null;
  unitTitle?: string | null;
  unitFallback?: string | null;
  startDateTime: number;
  endDateTime: number;
  zoomLink?: string | null;
  activityDoc?: string | null;
};

const BLUEDOT_ORGANIZER_EMAIL = 'team@bluedot.org';
const BLUEDOT_ORGANIZER_NAME = 'BlueDot Impact';
const MAX_ICS_LINE_LENGTH = 75;

const escapeIcsText = (value: string) => value
  .replaceAll('\\', '\\\\')
  .replaceAll('\n', '\\n')
  .replaceAll(';', '\\;')
  .replaceAll(',', '\\,');

const formatUtcDateTime = (timestampSeconds: number) => {
  const isoString = new Date(timestampSeconds * 1000).toISOString();
  return isoString.replaceAll('-', '').replaceAll(':', '').replace('.000', '');
};

const foldIcsLine = (line: string) => {
  if (line.length <= MAX_ICS_LINE_LENGTH) {
    return [line];
  }

  const foldedLines = [line.slice(0, MAX_ICS_LINE_LENGTH)];
  let remaining = line.slice(MAX_ICS_LINE_LENGTH);

  while (remaining.length > 0) {
    foldedLines.push(` ${remaining.slice(0, MAX_ICS_LINE_LENGTH - 1)}`);
    remaining = remaining.slice(MAX_ICS_LINE_LENGTH - 1);
  }

  return foldedLines;
};

const parseUnitFallback = (unitFallback?: string | null) => {
  if (!unitFallback) {
    return null;
  }

  const separatorIndex = unitFallback.indexOf(':');
  if (separatorIndex === -1) {
    return { number: null as number | null, title: unitFallback.trim() };
  }

  const possibleNumber = Number(unitFallback.slice(0, separatorIndex).trim());
  return {
    number: Number.isFinite(possibleNumber) ? possibleNumber : null,
    title: unitFallback.slice(separatorIndex + 1).trim(),
  };
};

export const getDiscussionCalendarSummary = ({
  courseTitle,
  unitNumber,
  unitTitle,
  unitFallback,
}: Pick<DiscussionCalendarData, 'courseTitle' | 'unitNumber' | 'unitTitle' | 'unitFallback'>) => {
  const parsedFallback = parseUnitFallback(unitFallback);
  const resolvedUnitNumber = unitNumber ?? parsedFallback?.number ?? null;
  const resolvedUnitTitle = unitTitle ?? parsedFallback?.title ?? null;

  let discussionLabel = 'Discussion';

  if (resolvedUnitNumber && resolvedUnitTitle) {
    discussionLabel = `Unit ${resolvedUnitNumber}: ${resolvedUnitTitle}`;
  } else if (resolvedUnitTitle) {
    discussionLabel = resolvedUnitTitle;
  } else if (resolvedUnitNumber) {
    discussionLabel = `Unit ${resolvedUnitNumber}`;
  }

  return `${courseTitle ?? 'BlueDot Impact'} - ${discussionLabel}`;
};

export const getDiscussionCalendarFilename = (summary: string) => `${summary
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'bluedot-discussion'}.ics`;

export const createDiscussionCalendarIcs = (discussion: DiscussionCalendarData) => {
  const summary = getDiscussionCalendarSummary(discussion);
  const descriptionLines = [
    `${summary} with BlueDot Impact.`,
    discussion.zoomLink ? `Join Zoom: ${discussion.zoomLink}` : null,
    discussion.activityDoc ? `Discussion doc: ${discussion.activityDoc}` : null,
    discussion.coursePath ? `Course page: ${discussion.coursePath}` : null,
  ].filter((line): line is string => Boolean(line));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BlueDot Impact//Course Discussions//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${discussion.discussionId}@bluedot.org`,
    `DTSTAMP:${formatUtcDateTime(Math.floor(Date.now() / 1000))}`,
    `DTSTART:${formatUtcDateTime(discussion.startDateTime)}`,
    `DTEND:${formatUtcDateTime(discussion.endDateTime)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines.join('\n'))}`,
    'STATUS:CONFIRMED',
    discussion.zoomLink ? `URL:${discussion.zoomLink}` : null,
    discussion.zoomLink ? 'LOCATION:Zoom' : 'LOCATION:Online',
    `ORGANIZER;CN=${escapeIcsText(BLUEDOT_ORGANIZER_NAME)}:mailto:${BLUEDOT_ORGANIZER_EMAIL}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => Boolean(line));

  return {
    filename: getDiscussionCalendarFilename(summary),
    content: `${lines.flatMap(foldIcsLine).join('\r\n')}\r\n`,
    summary,
  };
};
