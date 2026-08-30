import { createStore } from 'vuex';
import modules from './modules';

export default createStore({
  state: {
    pageFirstInteraction: true,
    avoidKeyListeners: false,
  },

  getters: {
    pageFirstInteraction: (state) => state.pageFirstInteraction,
    avoidKeyListeners: (state) => state.avoidKeyListeners,
  },

  mutations: {
    setPageFirstInteraction: (state, payload) => {
      state.pageFirstInteraction = payload;
    },

    setAvoidKeyListeners: (state, payload) => {
      state.avoidKeyListeners = payload;
    },
  },

  modules,
});
