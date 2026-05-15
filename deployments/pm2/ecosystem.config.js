module.exports = {
  apps: [
    {
      name: 'portal-backend',
      cwd: './apps/backend-portal-api-rd-omada',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'portal-frontend',
      cwd: '.',
      script: './node_modules/.bin/serve',
      args: '-s public -l 3000',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
