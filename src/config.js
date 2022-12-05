var url =
  process.env.VUE_APP_ENV === 'production'
    ? ''
    : `http://localhost:${process.env.VUE_APP_LOCAL_BACKEND_PORT}`;
url += '/api';

module.exports = {
  BACKEND_API_URL: url,
};
