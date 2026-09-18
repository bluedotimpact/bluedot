import createHttpError from 'http-errors';
import { isAdmin } from './airtable';

export const requireAdmin = async (email: string) => {
  if (!(await isAdmin(email))) {
    throw new createHttpError.Forbidden('This tool is for course leads');
  }
};
