import config from './config';
import logger from './utils/logger';
import app from './app';

app.listen(config.PORT, () => {
  logger.info(`Backend listening on ${config.PORT}`);
});
