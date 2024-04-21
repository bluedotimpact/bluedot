export function snapToRect(
  {
    top, bottom, left, right,
  }: { top: number, bottom: number, left: number, right: number },
  { x, y }: { x: number, y: number },
) {
  return {
    // eslint-disable-next-line no-nested-ternary
    x: x < left ? left + 5 : x > right ? right - 5 : x,
    // eslint-disable-next-line no-nested-ternary
    y: y > bottom ? bottom - 5 : y < top ? top + 5 : y,
  };
}

// pad number with zeros so that it has 2 digits
export function pad(num: number) {
  return num < 10 ? `0${num}` : num;
}
