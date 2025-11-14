import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';

const router = Router();
const openapiPath = path.resolve(process.cwd(), '../docs/openapi/openapi.yaml');

if (!fs.existsSync(openapiPath)) {
  throw new Error(`OpenAPI spec not found at ${openapiPath}`);
}

const openapiContent = fs.readFileSync(openapiPath, 'utf8');
const swaggerDocument = parse(openapiContent);

router.get('/docs/openapi.yaml', (_req, res) => {
  res.type('application/yaml').send(openapiContent);
});

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

export default router;
