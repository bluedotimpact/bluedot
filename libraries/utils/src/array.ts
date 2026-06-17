/** Split an array into consecutive chunks of at most `size` elements. The final chunk may be smaller. */
export function chunk<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) {
    out.push(xs.slice(i, i + size));
  }

  return out;
}
