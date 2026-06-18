/** Split an array into consecutive chunks of at most `size` elements. The final chunk may be smaller. */
export function chunk<T>(xs: T[], size: number): T[][] {
  if (xs.length === 0) return [];
  if (size <= 0) throw new RangeError(`chunk size must be a positive number, got ${size}`);
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) {
    out.push(xs.slice(i, i + size));
  }

  return out;
}
