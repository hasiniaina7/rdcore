import { RequestHandler } from 'express';
import { randomUUID } from 'crypto';

const requestContext: RequestHandler = (req, _res, next) => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = randomUUID();
  }
  req.requestId = String(req.headers['x-request-id']);
  next();
};

export default requestContext;
