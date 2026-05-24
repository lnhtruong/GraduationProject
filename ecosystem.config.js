/**
 * PM2 trên VPS — không chạy api_gateway (gateway deploy trên Render).
 * Mỗi app dùng .env.deploy (deploy_be.sh copy sang .env trước khi start).
 *
 * Port: 8001 auth | 8002 user | 8003 media | 8006 payment | 8007 inference
 *       8008 course | 8009 mail
 */
module.exports = {
  apps: [
    {
      name: "auth_service",
      cwd: "./backend_services/auth_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/auth_service/.env.deploy",
    },
    {
      name: "user_service",
      cwd: "./backend_services/user_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/user_service/.env.deploy",
    },
    {
      name: "media_service",
      cwd: "./backend_services/media_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/media_service/.env.deploy",
    },
    {
      name: "payment_service",
      cwd: "./backend_services/payment_service",
      script: "src/server.js",
      interpreter: "node",
      env_file: "./backend_services/payment_service/.env.deploy",
    },
    {
      name: "inference_service",
      cwd: "./backend_services/inference_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/inference_service/.env.deploy",
    },
    {
      name: "course_service",
      cwd: "./backend_services/course_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/course_service/.env.deploy",
    },
    {
      name: "mail_service",
      cwd: "./backend_services/mail_service",
      script: "src/server.js",
      interpreter: "node",
      env_file: "./backend_services/mail_service/.env.deploy",
    },
  ],
};
