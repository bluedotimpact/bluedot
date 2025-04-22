export const maybePlural = (count: number, base: string, pluralEnding: string = 's'): string => {
  return `${count} ${base}${count === 1 ? '' : pluralEnding}`;
};
