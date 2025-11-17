import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const router = Router();
const openapiPath = path.resolve(process.cwd(), '../docs/openapi/openapi.yaml');

if (!fs.existsSync(openapiPath)) {
  throw new Error(`OpenAPI spec not found at ${openapiPath}`);
}

router.get('/docs/openapi.yaml', (_req, res, next) => {
  try {
    const openapiContent = fs.readFileSync(openapiPath, 'utf8');
    res.setHeader('Cache-Control', 'no-store');
    res.type('application/yaml').send(openapiContent);
  } catch (error) {
    next(error);
  }
});

const swaggerUiHandler = swaggerUi.setup(undefined, {
  explorer: true,
  swaggerOptions: {
    url: '/docs/openapi.yaml',
  },
});

router.use('/docs', swaggerUi.serve, swaggerUiHandler);

export default router;
