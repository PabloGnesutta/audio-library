require('dotenv').config({ quiet: true });
const port = process.env.PORT || 3000;

const express = require('express'),
  path = require('path'),
  cors = require('cors'),
  helmet = require('helmet'),
  app = express(),
  publicPath = path.join(__dirname, '../', '__client-app-build'),
  { connect } = require('mongoose');

// CSP is left off: the audio player streams from an external R2 origin and,
// in dev, the frontend calls this API cross-origin -- helmet's default CSP
// would block both. Revisit once the CSP can allowlist the real R2 domain.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.static(publicPath));
app.use(express.json());

const { authorizationMiddleware } = require('./controllers/auth-controller');
const { get404 } = require('./controllers/error-controller');
const authRoutes = require('./routes/auth-routes');
const fileRoutes = require('./routes/file-routes');
const userRoutes = require('./routes/user-routes');
const bookmarkRoutes = require('./routes/bookmark-routes');
const shareRoutes = require('./routes/share-routes');

app.use('/api/auth', authRoutes);
app.use('/api/user', authorizationMiddleware, userRoutes);
app.use('/api/file', authorizationMiddleware, fileRoutes);
app.use('/api/bookmark', authorizationMiddleware, bookmarkRoutes);
app.use('/api/share', authorizationMiddleware, shareRoutes);
app.use('/api', get404);

//SPA
app.use('/', (req, res) => {
  console.log('/', req.url);
  res.sendFile(path.join(publicPath, 'index.html'));
});

//ERROR HANDLING
const { erorHandler } = require('./controllers/error-controller');
app.use(erorHandler);

//START SERVER
app.listen(port, () => {
  console.info('****************************************');
  console.log(`*  Server listening on port ${port}`);
  connectMongoDB();
});

function connectMongoDB() {
  connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`
  )
    .then(() => {
      console.info('*  MongoDB successfully connected      *');
    })
    .catch((err) => {
      console.error('(!) Error al conectar con MongoDB', err);
    })
    .finally(() => {
      console.info('****************************************');
    });
}
