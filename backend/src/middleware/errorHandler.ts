import { ErrorRequestHandler } from 'express';
import createError from 'http-errors';
import logger from '../utils/logger';

const errorHandler: ErrorRequestHandler = (err, req, res) => {
  const httpErr = createError(err.status || 500, err.message, err);
  const status = httpErr.status || 500;
  logger.error({
    err,
    requestId: req.requestId,
    path: req.path,
  });

  res.status(status).json({
    success: false,
    message: httpErr.message,
    status,
    requestId: req.requestId,
  });
};

export default errorHandler;
