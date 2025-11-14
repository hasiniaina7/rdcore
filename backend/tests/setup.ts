const defaults: Record<string, string> = {
  RADIUS_BASE_URL: 'https://localhost/cake4/rd_cake',
  RADIUS_TOKEN_LOCAL: 'test-token',
  RADIUS_CLOUD_ID: '1',
  OMADA_BASE_URL: 'https://omada.example.com',
  OMADA_OPERATOR: 'Operator',
  OMADA_PASSWORD: 'Operator@123',
  PORTAL_PUBLIC_URL: 'https://portal.example.com',
  PORTAL_SUCCESS_URL: 'https://portal.example.com/success',
  LOG_LEVEL: 'silent',
  DEFAULT_LANGUAGE: 'fr_FR',
  ENABLE_SSE_USAGE: 'false',
};

Object.entries(defaults).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});
