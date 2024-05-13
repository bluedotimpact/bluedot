export const validateEnv = <T extends string>(
  envSource: Record<string, string | undefined>,
  expectedVars: readonly T[],
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
