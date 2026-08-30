import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import AuthController from '@/controller/auth-controller';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
  },

  {
    path: '/verify-email/:token',
    name: 'VerifyEmail',
    component: () => import('../views/auth/VerifyEmail.vue'),
  },
];

const router = createRouter({
  history: createWebHistory('audio-library'), //BASE_URL
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const { data } = await AuthController.verifySession();
      const { user, folders, files } = data;
      store.commit('auth/setUser', user);
      store.commit('tree/refreshTree', { folders, files });
    } catch (_err) {
      store.commit('auth/doLogout');
      return next({ name: 'Login' });
    }
  }

  next();
});

export default router;
