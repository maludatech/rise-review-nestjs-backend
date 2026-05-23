import { Logger } from '@nestjs/common';

const logger = new Logger('App');

export const log = {
  info: (msg: any, ...meta: any[]) => logger.log(msg, ...meta),
  warn: (msg: any, ...meta: any[]) => logger.warn(msg, ...meta),
  error: (msg: any, ...meta: any[]) => logger.error(msg, ...meta),
};
