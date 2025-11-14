import { RequestHandler } from 'express';
import { nanoid } from 'nanoid';

const requestContext: RequestHandler = (req, _res, next) => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = nanoid();
  }
  req.requestId = String(req.headers['x-request-id']);
  next();
};

export default requestContext;
