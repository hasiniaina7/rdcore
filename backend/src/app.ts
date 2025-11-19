import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import requestContext from './middleware/requestContext';
import dynamicRoutes from './routes/dynamic';
import connectRoutes from './routes/connect';
import usageRoutes from './routes/usage';
import authRoutes from './routes/auth';
import socialRoutes from './routes/social';
import docsRoutes from './routes/docs';
import healthRoutes from './routes/health';
import adminRoutes from './routes/admin';
import errorHandler from './middleware/errorHandler';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(requestContext);
app.use(
  pinoHttp({
    customProps: (req) => ({ requestId: req.requestId, username: req.body?.username }),
  })
);

app.use(docsRoutes);
app.use('/api', dynamicRoutes);
app.use('/api', connectRoutes);
app.use('/api', authRoutes);
app.use('/api', usageRoutes);
app.use('/api', socialRoutes);
app.use('/api', adminRoutes);
app.use('/', healthRoutes);

app.use(errorHandler);

export default app;
