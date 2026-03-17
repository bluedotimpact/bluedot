import createHttpError from 'http-errors';
import { userTable } from '@bluedot/db';
import db from './db';

export const requireAdmin = async (email: string) => {
  const user = await db.getFirst(userTable, { filter: { email: email.toLowerCase() } });
  if (!user?.isAdmin) {
    throw new createHttpError.Forbidden('Admin access required');
  }
};
