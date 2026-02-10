/**
 * Validate that all required environment variables exist and are not empty.
 * Optional variables are included if set and non-empty.
 * Throws an error if any required variables are missing.
 * @param required Array of required environment variable names.
 * @param optional Array of optional environment variable names.
 * @param envSource Object to get environment variables from. Defaults to process.env.
 */
export const validateEnv = <R extends string, O extends string>({
  required,
  optional,
  envSource = process.env,
}: {
  required: readonly R[];
  optional?: readonly O[];
  envSource?: Record<string, string | undefined>;
}): Record<R, string> & Partial<Record<O, string>> => {
  const env = {} as Record<R, string> & Partial<Record<O, string>>;
  const unset: string[] = [];

  required.forEach((envVar) => {
    const value = envSource[envVar]?.trim();
    if (value === undefined || value.length === 0) {
      unset.push(envVar);
      return;
    }

    (env as Record<R, string>)[envVar] = value;
  });

  if (unset.length > 0) {
    throw new Error(`Unset environment variables: ${unset.join(', ')}`);
  }

  optional?.forEach((envVar) => {
    const value = envSource[envVar]?.trim();
    if (value !== undefined && value.length > 0) {
      (env as Record<O, string>)[envVar] = value;
    }
  });

  return env;
};
