import winston from 'winston';
import { consoleFormat } from 'winston-console-format';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
  ),
  transports: [
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env.NODE_ENV === 'production'
      // in prod: stdout, as json
      ? new winston.transports.Console({
        format: winston.format.json(),
      })
      // in development: stdout, but pretty 🌈
      : new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          consoleFormat({ metaStrip: ['timestamp'] }),
        ),
      }),
  ],
});
