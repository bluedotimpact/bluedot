import { AxiosError } from 'axios';

export const formatStringToArray = (
  input: string | null | undefined,
  splitBy: string,
): string[] => {
  return input
    ? input
      .split(splitBy)
      .map((o) => o.trim())
      .filter((item) => item !== '')
    : [];
};

export const parseZodValidationError = (err: AxiosError<{ error?: string }>, defaultErrorMessage: string): string => {
  const errorString = err.response?.data?.error;
  if (typeof errorString === 'string' && errorString.startsWith('Invalid request body: ')) {
    try {
      // Extract the JSON array from the error string
      const jsonPart = errorString.replace('Invalid request body: ', '');
      const validationErrors = JSON.parse(jsonPart);
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0].message || defaultErrorMessage;
      }
      return defaultErrorMessage;
    } catch {
      return defaultErrorMessage;
    }
  }

  return defaultErrorMessage;
};

export const buildGroupSlackChannelUrl = (slackChannelId: string) => {
  return `https://app.slack.com/client/T01K0M15NEQ/${slackChannelId}`;
};

/** Example: '3:00 PM' */
export const formatTime12HourClock = (dateTimeSeconds: number): string => {
  const date = new Date(dateTimeSeconds * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/** Format an ISO date string as 'day month' in UTC. Example: '9 Feb' */
export const formatMonthAndDay = (isoDate: string): string => {
  const date = new Date(isoDate);
  const day = String(date.getUTCDate());
  const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${day} ${month}`;
};

/** Example: 'Jun 19' */
export const formatDateMonthAndDay = (dateTimeSeconds: number): string => {
  const date = new Date(dateTimeSeconds * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/** Example: 'Tue' */
export const formatDateDayOfWeek = (dateTimeSeconds: number): string => {
  const date = new Date(dateTimeSeconds * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
  });
};

/** Examples: 'now', 'in 5 minutes', 'in 1 hour 30 minutes', '5 minutes ago' */
export const formatDateTimeRelative = ({
  dateTimeMs,
  currentTimeMs,
}: {
  dateTimeMs: number;
  currentTimeMs: number;
}): string => {
  const timeDiffMs = dateTimeMs - currentTimeMs;

  // Helper to pluralize units
  const pluralizeTimeUnit = (value: number, unit: string) => `${value} ${unit}${value !== 1 ? 's' : ''}`;

  // Helper to build human-readable time until/since
  const buildRelativeTimeString = (minutes: number, hours: number, calendarDays: number, suffix: string) => {
    if (calendarDays >= 1) {
      return `${pluralizeTimeUnit(calendarDays, 'day')}${suffix}`;
    }
    if (hours >= 1) {
      const remainingMinutes = minutes % 60;
      const hourPart = pluralizeTimeUnit(hours, 'hour');
      return remainingMinutes > 0
        ? `${hourPart} ${pluralizeTimeUnit(remainingMinutes, 'minute')}${suffix}`
        : `${hourPart}${suffix}`;
    }
    return `${pluralizeTimeUnit(minutes, 'minute')}${suffix}`;
  };

  // Calculate time units
  const absMinutes = Math.abs(Math.floor(timeDiffMs / (1000 * 60)));
  const absHours = Math.floor(absMinutes / 60);

  // Calculate calendar days instead of just dividing hours by 24
  // This ensures "in X days" reflects actual calendar days, not 24-hour periods
  const startOfNow = new Date(currentTimeMs);
  startOfNow.setHours(0, 0, 0, 0);

  const startOfTarget = new Date(dateTimeMs);
  startOfTarget.setHours(0, 0, 0, 0);

  // Get absolute number of calendar days between dates
  const absCalendarDays = Math.abs(Math.round((startOfTarget.getTime() - startOfNow.getTime()) / (1000 * 60 * 60 * 24)));

  // Determine relative time string
  if (timeDiffMs >= 0 && timeDiffMs < 60000) {
    return 'now';
  }
  if (timeDiffMs > 0) {
    return `in ${buildRelativeTimeString(absMinutes, absHours, absCalendarDays, '')}`;
  }
  return buildRelativeTimeString(absMinutes, absHours, absCalendarDays, ' ago');
};

export const buildCourseUnitUrl = ({ courseSlug, unitNumber, chunkNumber = 1 }: { courseSlug: string, unitNumber: string | number, chunkNumber?: number }) => `/courses/${courseSlug}/${unitNumber}/${chunkNumber}`;

export const getActionPlanUrl = (meetPersonId: string) => `https://web.miniextensions.com/7WZKkZiusMiAO1RMznFv?prefill_Participant=${meetPersonId}`;
