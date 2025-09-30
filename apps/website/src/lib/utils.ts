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

/** Example: '3:00 PM' */
export const formatTime12HourClock = (dateTimeSeconds: number): string => {
  const date = new Date(dateTimeSeconds * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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

/** Examples: 'starting now', 'in 5 minutes', 'in 1 hour 30 minutes', '5 minutes ago' */
export const formatDateTimeRelative = (dateTimeSeconds: number): string => {
  const startDate = new Date(dateTimeSeconds * 1000);
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
  if (timeDiffMs >= 0 && timeDiffMs < 60000) {
    return 'starting now';
  }
  if (timeDiffMs > 0) {
    return `in ${buildRelativeTimeString(absMinutes, absHours, absDays, '')}`;
  }
  return buildRelativeTimeString(absMinutes, absHours, absDays, ' ago');
};
