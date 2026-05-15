import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const router = Router();
const openapiPath = path.resolve(process.cwd(), '../../docs/api/openapi.yaml');

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

// Preload and parse the OpenAPI spec to avoid client-side parsing issues
const openapiObject = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
router.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiObject, { explorer: true }));

export default router;
