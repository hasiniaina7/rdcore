import pino from 'pino';
import config from '../config';

const redact = ['OMADA_PASSWORD', 'RADIUS_TOKEN_LOCAL'];

const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: redact,
    censor: '***',
  },
});

export default logger;
