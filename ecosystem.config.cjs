module.exports = {
  apps: [
    {
      name: "lesbarbieres-app",
      script: "serve",
      env: {
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_PORT: 3041,
        PM2_SERVE_SPA: "true",
        NODE_ENV: "production"
      }
    }
  ]
};
