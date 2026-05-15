import 'express-serve-static-core';
import type { AdminSession } from './index';

declare module 'http' {
  interface IncomingMessage {
    requestId?: string;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    adminSession?: AdminSession;
    adminTokenValue?: string;
  }
}
