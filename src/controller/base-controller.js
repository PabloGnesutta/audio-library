import axios from 'axios';
import store from '@/store';

const Config = require('../config');

const BASE_URL = Config.BACKEND_API_URL;

const transport = axios.create({ withCredentials: true });

transport.interceptors.request.use(
  (request) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      request.headers['Authorization'] = 'Bearer ' + accessToken;
    }
    return request;
  },
  (error) => Promise.reject(error)
);

transport.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response.status;

    if (status != 401) {
      // forward all not-401 errors
      return Promise.reject(error);
    }

    // 401 token expired, RETRY
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const config = {
        headers: {
          Authorization: 'Bearer ' + refreshToken,
        },
      };

      const originalRequest = error.config;
      return axios
        .post(Config.BACKEND_API_URL + '/refresh-access-token', null, config)
        .then((response) => {
          const newAccessToken = response.data;
          refreshAccessToken(newAccessToken);
          return resendRequest(originalRequest, newAccessToken);
        })
        .then((response) => {
          console.log('Request retry OK!');
          return Promise.resolve(response);
        })
        .catch((_err) => {
          // login again
          console.warn('Request retry failed', _err);
          handleTokenError();
        });
    } else {
      handleTokenError();
    }
  }
);

function handleTokenError() {
  store.commit('auth/doLogout');
  store.commit('auth/doLogout');
  console.log('handleTokenError');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

function refreshAccessToken(newAccessToken) {
  localStorage.setItem('accessToken', newAccessToken);
}

function resendRequest(originalRequest, newAccessToken) {
  originalRequest._retry = true;
  originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
  return axios(originalRequest);
}

class BaseController {
  static get(ruta, queryParams) {
    return transport.get(BASE_URL + ruta, { params: queryParams });
  }

  static post(ruta, body, config) {
    return transport.post(BASE_URL + ruta, body, { config });
  }

  static put(ruta, body, headers) {
    return transport.put(BASE_URL + ruta, body, { headers: headers });
  }

  static patch(ruta, body, headers) {
    return transport.patch(BASE_URL + ruta, body, { headers: headers });
  }

  static delete(ruta, body, config) {
    return transport.delete(BASE_URL + ruta, body, { config });
  }
}

export default BaseController;
