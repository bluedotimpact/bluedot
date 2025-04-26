import { exec } from 'node:child_process';

export const execAsync = (command: string): Promise<string> => new Promise((resolve, reject) => {
  exec(command, (error, stdout) => {
    if (error) {
      reject(error);
    } else {
      resolve(stdout.trim());
    }
  });
});
