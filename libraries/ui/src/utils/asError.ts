/** Coerce any input to an Error object */
export const asError = (input: unknown): Error => {
  if (input instanceof Error) {
    return input;
  }

  if (typeof input === 'object' && input !== null && 'error' in input && input.error instanceof Error) {
    return input.error;
  }

  if (typeof input === 'string') {
    return new Error(input);
  }

  try {
    return new Error(JSON.stringify(input));
  } catch {
    return new Error(String(input));
  }
};
