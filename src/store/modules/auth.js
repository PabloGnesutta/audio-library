
export default {
  namespaced: true,

  state: {
    user: {},
  },

  getters: {
    user: (state) => state.user,
  },

  mutations: {
    setUser: (state, payload) => {
      state.user = payload;
      state.user.loaded = true;
    },

    doLogout: (state) => {
      state.user = {};
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },

    setAccessToken: (_, payload) => {
      localStorage.setItem("accessToken", payload);
    },

    setRefreshToken: (_, payload) => {
      localStorage.setItem("refreshToken", payload);
    },
  },
};
