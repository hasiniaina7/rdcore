module.exports = {
  apps: [
    {
      name: 'portal-backend',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'portal-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
