/**
 * Validate that all environment variables exist and are not empty
 * Throws an error if any are missing
 * @param expectedVars Array of environment variable names, should be keys of envSource
 * @param envSource Object to get environment variables from. Defaults to process.env.
 * @returns Typed object with the expected environment variables
 */
export const validateEnv = <T extends string>(
  expectedVars: readonly T[],
  envSource: Record<string, string | undefined> = process.env,
): Record<T, string> => {
  const env = {} as Record<T, string>;
  const unset: string[] = [];

  expectedVars.forEach((envVar) => {
    const value = envSource[envVar]?.trim();
    if (value === undefined || value.length === 0) {
      unset.push(envVar);
      return;
    }
    env[envVar] = value;
  });

  if (unset.length > 0) {
    throw new Error(`Unset environment variables: ${unset.join(', ')}`);
  }

  return env;
};
