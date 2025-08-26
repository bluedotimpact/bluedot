import { InferSelectModel, type courseRegistrationTable } from '@bluedot/db';
import { AxiosError } from 'axios';

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
  }

  return defaultErrorMessage;
};

type CourseRegistration = InferSelectModel<typeof courseRegistrationTable.pg>;
/**
 * Workaround for duplicates existing in rare cases, see issue: https://github.com/bluedotimpact/bluedot/issues/1249
 */
export const stablePickCourseRegistration = (
  courseRegistrations: CourseRegistration[],
): CourseRegistration | undefined => {
  // Sort by ID to ensure stable selection when multiple records exist
  // This ensures we always work with the same registration record
  courseRegistrations.sort((a, b) => a.id.localeCompare(b.id));

  return courseRegistrations[0];
};
