import type { Event } from '../../server/routers/luma';

/** Given a transformed Luma event, returns a time delta string:
 * 1. If the event is online, the time delta is shown in local user time, e.g. "Mon 9:00 am - 5:00 pm GMT+2" (for a user in
 *    GMT+2)
 * 2. If the event is in-person, the time delta is shown in the event's timezone, e.g. "Mon 2 pm - 5 pm GMT" (even if user
 *    in GMT+2)
 * 3. If the event is shown over multiple days, the end date is in brackets with timezone after, e.g. "Mon 9:00 am - Fri 5:00 pm (5 Mar) GMT"
 */
export const buildTimeDeltaString = (event: Event, locale?: string) => {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const timeZone = event.location === 'ONLINE' ? undefined : event.timezone;

  const dateComparator = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone,
  });
  const isMultiDay = dateComparator.format(startDate) !== dateComparator.format(endDate);

  const formatTime = (date: Date, extraOptions: Intl.DateTimeFormatOptions = {}) => {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
      ...extraOptions,
    }).format(date);
  };

  const timeStart = formatTime(startDate, { weekday: 'short' });

  if (isMultiDay) {
    const timeEndWeekday = formatTime(endDate, { weekday: 'short' });
    const timeEndDate = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone,
    }).format(endDate);

    const timezoneParts = new Intl.DateTimeFormat(locale, {
      timeZoneName: 'short',
      timeZone,
    }).formatToParts(endDate);
    const timezone = timezoneParts.find((part) => part.type === 'timeZoneName')?.value ?? '';

    return `${timeStart} - ${timeEndWeekday} (${timeEndDate}) ${timezone}`;
  }

  const timeEnd = formatTime(endDate, { timeZoneName: 'short' });
  return `${timeStart} - ${timeEnd}`;
};
