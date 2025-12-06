const path = require('path');

module.exports = {
  apps: [
    {
      name: 'portal-backend',
      cwd: __dirname,
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      watch: false,
      env_file: path.resolve(__dirname, '../.env')
    }
  ]
};
