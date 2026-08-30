# Deployment

at root:
    npm i && npm run build

/packages/backend:
    cp .env.example .env
    fill in variables
    pm2 start ecosystem.config.js