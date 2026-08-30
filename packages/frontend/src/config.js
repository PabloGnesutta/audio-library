var url =
  import.meta.env.VUE_APP_ENV === 'production'
    ? ''
    : `http://localhost:${import.meta.env.VUE_APP_LOCAL_BACKEND_PORT}`;

url += '/api';

export default {
  BACKEND_API_URL: url,
};
