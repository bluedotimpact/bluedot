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

/**
 * Takes a timestamp (in Airtable format, seconds) and returns display strings:
 * - startTimeDisplayRelative: 'starting now'/'in 5 minutes'/'5 minutes ago'
 * - startTimeDisplayDate: 'Jun 8'
 * - startTimeDisplayTime: '3:00 PM'
 */
export const getDiscussionTimeDisplayStrings = (startDateTime: number) => {
  const startDate = new Date(startDateTime * 1000);
  const now = new Date();
  const timeDiffMs = startDate.getTime() - now.getTime();

  // Helper to pluralize units
  const pluralizeTimeUnit = (value: number, unit: string) => `${value} ${unit}${value !== 1 ? 's' : ''}`;

  // Helper to build human-readable time until/since
  const buildRelativeTimeString = (minutes: number, hours: number, days: number, suffix: string) => {
    if (days >= 1) {
      return `${pluralizeTimeUnit(days, 'day')}${suffix}`;
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
  const absDays = Math.floor(absHours / 24);

  // Determine relative time string
  let startTimeDisplayRelative: string;
  if (timeDiffMs >= 0 && timeDiffMs < 60000) {
    startTimeDisplayRelative = 'starting now';
  } else if (timeDiffMs > 0) {
    startTimeDisplayRelative = `in ${buildRelativeTimeString(absMinutes, absHours, absDays, '')}`;
  } else {
    startTimeDisplayRelative = buildRelativeTimeString(absMinutes, absHours, absDays, ' ago');
  }

  // Format date and time
  const startTimeDisplayDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const startTimeDisplayTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { startTimeDisplayRelative, startTimeDisplayDate, startTimeDisplayTime };
};
