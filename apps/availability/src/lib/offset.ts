export const offsets = [
  'UTC-12:00',
  'UTC-11:00',
  'UTC-10:00',
  'UTC-09:30',
  'UTC-09:00',
  'UTC-08:00',
  'UTC-07:00',
  'UTC-06:00',
  'UTC-05:00',
  'UTC-04:00',
  'UTC-03:30',
  'UTC-03:00',
  'UTC-02:00',
  'UTC-01:00',
  'UTC00:00',
  'UTC+01:00',
  'UTC+02:00',
  'UTC+03:00',
  'UTC+03:30',
  'UTC+04:00',
  'UTC+04:30',
  'UTC+05:00',
  'UTC+05:30',
  'UTC+05:45',
  'UTC+06:00',
  'UTC+06:30',
  'UTC+07:00',
  'UTC+08:00',
  'UTC+08:45',
  'UTC+09:00',
  'UTC+09:30',
  'UTC+10:00',
  'UTC+10:30',
  'UTC+11:00',
  'UTC+12:00',
  'UTC+12:45',
  'UTC+13:00',
  'UTC+14:00',
];

export function parseOffsetFromStringToMinutes(offset: string): number {
  if (offset === 'UTC00:00') {
    return 0;
  }

  if (!/UTC(\+|-)\d\d:\d\d/.test(offset)) {
    throw new Error(`Unsupported timezone: ${offset}`);
  }

  const sign = offset[3] === '-' ? 1 : -1;
  const minutes = (parseInt(offset[4]!) * 10 + parseInt(offset[5]!)) * 60 + (parseInt(offset[7]!) * 10 + parseInt(offset[8]!));
  return sign * minutes;
}

export function formatOffsetFromMinutesToString(minutes: number): string {
  const signSymbol = minutes === 0 ? '' : (minutes < 0 ? '+' : '-');
  return `UTC${signSymbol}${(Math.floor(Math.abs(minutes) / 60)).toString().padStart(2, '0')}:${(Math.floor(Math.abs(minutes) % 60)).toString().padStart(2, '0')}`;
}
