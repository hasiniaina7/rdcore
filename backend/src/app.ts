import express from 'express';
import helmet from 'helmet';
import cors, { type CorsOptions } from 'cors';
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
import config from './config';

const app = express();

const allowedOrigins = config.CORS_ALLOWED_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean);
const allowAllOrigins = allowedOrigins.length === 0 || allowedOrigins.includes('*');
const corsOptions: CorsOptions = {
  origin: allowAllOrigins ? true : allowedOrigins,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 600,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
