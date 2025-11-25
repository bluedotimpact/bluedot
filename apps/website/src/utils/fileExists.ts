import { constants } from 'fs';
import fs from 'fs/promises';

export const fileExists = async (file: string) => {
  try {
    await fs.access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};
