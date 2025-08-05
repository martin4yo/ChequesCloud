module.exports = {
  apps: [
    {
      name: 'chequescloud-backend',
      script: './backend/dist/server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      time: true,
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'chequescloud-frontend',
      script: 'serve',
      args: '-s dist -l 5173',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/frontend.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      time: true,
      watch: false,
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};