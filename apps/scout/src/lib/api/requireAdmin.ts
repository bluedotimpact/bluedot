import createHttpError from 'http-errors';
import { isAdmin } from './airtable';

export const requireAdmin = async (email: string, options: { fresh?: boolean } = {}) => {
  if (!(await isAdmin(email, options))) {
    throw new createHttpError.Forbidden('This tool is for course leads');
  }
};
