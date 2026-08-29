import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import eventBus from '@/plugins/event-bus';
import AuthController from '@/controller/auth-controller';
import ErrorMixin from '@/plugins/error-mixin';

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
      const msg = ErrorMixin.methods._formatError(_err);
      eventBus.$emit('push_toast', { msg });

      store.commit('auth/doLogout');
      return next({ name: 'Login' });
    }
  }

  next();
});

export default router;
