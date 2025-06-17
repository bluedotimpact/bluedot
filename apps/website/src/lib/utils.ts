import { AxiosError } from "axios";

export const formatStringToArray = (
  input: string | null | undefined,
  splitBy: string,
): string[] => {
  return input
    ? input
      .split(splitBy)
      .map((o) => o.trim())
      .filter((item) => item !== '')
    : [];
};

export const parseZodValidationError = (err: AxiosError<{ error?: string }>, defaultErrorMessage: string): string => {
  const errorString = err.response?.data?.error;
  if (typeof errorString === 'string' && errorString.startsWith('Invalid request body: ')) {
    try {
      // Extract the JSON array from the error string
      const jsonPart = errorString.replace('Invalid request body: ', '');
      const validationErrors = JSON.parse(jsonPart);
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0].message || defaultErrorMessage;
      }
      return defaultErrorMessage;
    } catch {
      return defaultErrorMessage;
    }
  } else {
    return errorString || defaultErrorMessage;
  }
};