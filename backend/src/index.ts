import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import config from './config';
import logger from './utils/logger';
import requestContext from './middleware/requestContext';
import dynamicRoutes from './routes/dynamic';
import connectRoutes from './routes/connect';
import usageRoutes from './routes/usage';
import socialRoutes from './routes/social';
import healthRoutes from './routes/health';
import errorHandler from './middleware/errorHandler';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(requestContext);
app.use(
  pinoHttp({
    logger: logger as any,
    customProps: (req) => ({ requestId: req.requestId, username: req.body?.username }),
  })
);

app.use('/api', dynamicRoutes);
app.use('/api', connectRoutes);
app.use('/api', usageRoutes);
app.use('/api', socialRoutes);
app.use('/', healthRoutes);

app.use(errorHandler);

app.listen(config.PORT, () => {
  logger.info(`Backend listening on ${config.PORT}`);
});
