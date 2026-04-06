module.exports = {
  apps: [
    {
      name: "auth_service",
      cwd: "./backend_services/auth_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/auth_service/.env",
    },
    {
      name: "user_service",
      cwd: "./backend_services/user_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/user_service/.env",
    },
    //   {
    //     name: "mail_service",
    //     cwd: "/opt/graduation-project/backend_services/mail_service",
    //     script: "src/server.js",
    //     interpreter: "node",
    //     env_file: "/opt/graduation-project/backend_services/mail_service/.env"
    //   },
    {
      name: "payment_service",
      cwd: "./backend_services/payment_service",
      script: "src/server.js",
      interpreter: "node",
      env_file: "./backend_services/payment_service/.env"
    },
    {
      name: "api_gateway",
      cwd: "./backend_services/api_gateway",
      script: "dist/index.js",
      interpreter: "node",
      env_file: "./backend_services/api_gateway/.env",
    },
    {
      name: "media_service",
      cwd: "./backend_services/media_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/media_service/.env",
    },
    {
      name: "inference_service",
      cwd: "./backend_services/inference_service",
      script: "dist/main.js",
      interpreter: "node",
      env_file: "./backend_services/inference_service/.env",
    },
  ],
};
