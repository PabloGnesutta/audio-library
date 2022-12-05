
export default {
  namespaced: true,

  state: {
    totalDuration: 0,
    flooredCurrentTime: 0,
  },

  getters: {
    totalDuration: state => state.totalDuration,
    flooredCurrentTime: state => state.flooredCurrentTime,
  },

  mutations: {
    setTotalDuration: (state, payload) => {
      state.totalDuration = payload;
    },
    setFlooredCurrentTime: (state, payload) => {
      state.flooredCurrentTime = payload;
    }
  },

  actions: {
  },

};
