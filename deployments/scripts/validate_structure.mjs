#!/usr/bin/env node
import fs from 'node:fs';

const requiredPaths = [
  'apps/backend-portal-api-rd-omada',
  'apps/frontend-portal-web-personalized',
  'apps/frontend-infoconso-rd',
  'deployments/pm2/ecosystem.config.js',
  'deployments/scripts/deploy_backend.sh',
  'deployments/scripts/deploy_frontend.sh',
  'docs/api/openapi.yaml'
];

const forbiddenPaths = [
  'backend-all-portal',
  'frontend-portal-deprecated',
  'infoconso-frontend-rd',
  'omada-yt-portal',
  'apps/frontend-portal-web-personalized/demo-omada-captive-portal',
  'apps/frontend-portal-web-personalized/omada-captive-portail-exemple'
];

let ok = true;
for (const p of requiredPaths) {
  if (!fs.existsSync(p)) {
    console.error(`[missing] ${p}`);
    ok = false;
  }
}
for (const p of forbiddenPaths) {
  if (fs.existsSync(p)) {
    console.error(`[forbidden] ${p}`);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log('Structure validation passed');
