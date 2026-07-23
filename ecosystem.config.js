module.exports = {
  apps: [
    {
      name: "Chatbot-Admin",
      cwd: "/root/apps/nexora/chat/admin",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "/root/apps/nexora/logs/admin-error.log",
      out_file: "/root/apps/nexora/logs/admin-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
