import 'express-serve-static-core';

declare module 'http' {
  interface IncomingMessage {
    requestId?: string;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}
