/**
 * Logger Configuration
 */

import winston from 'winston';
import { config } from './config.js';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...rest }) => {
    const serviceName = service ? `[${service}]` : '';
    const restStr = Object.keys(rest).length > 0 ? `\n${JSON.stringify(rest, null, 2)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${serviceName} ${message}${restStr}`;
  })
);

const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ],
});

export function createLogger(service: string) {
  return logger.child({ service });
}

export default logger;
