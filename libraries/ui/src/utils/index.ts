export const maybePlural = (count: number, base: string, pluralEnding = 's'): string => {
  return `${count} ${base}${count === 1 ? '' : pluralEnding}`;
};
