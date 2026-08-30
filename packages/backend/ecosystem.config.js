module.exports = {
  apps: [
    {
      name: 'audiolibrary',
      script: './src/index.audio-library.js',
      cwd: __dirname,
      // Everything else (SECRET_KEY, DB_*, R2_*, SMTP_*, CORS_ORIGIN,
      // FRONTEND_URL, SIGNUP_FLAG) comes from .env in this directory --
      // dotenv.config() in index.audio-library.js reads it relative to
      // process.cwd(), which pm2 sets to `cwd` above. Only PORT is set
      // here since nginx's al.pablognesutta.com block expects this app
      // on :3005 specifically (see default.ratelimited.example).
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },
  ],
};
