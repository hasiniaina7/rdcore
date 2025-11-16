import { ErrorRequestHandler } from 'express';
import createError from 'http-errors';
import logger from '../utils/logger';

// 4 arguments obligatoires pour qu'Express reconnaisse bien le middleware d'erreur.
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = typeof err.message === 'string' && err.message.length > 0 ? err.message : 'Internal Server Error';
  const httpErr = createError(status, message);

  logger.error({
    err,
    requestId: req.requestId,
    path: req.path,
  });

  res.status(httpErr.status || 500).json({
    success: false,
    message: httpErr.message,
    status: httpErr.status || 500,
    requestId: req.requestId,
  });
};

export default errorHandler;
