export default {
  namespaced: true,

  state: {
    outgoing: [],
    incoming: [],
  },

  getters: {
    outgoing: (state) => state.outgoing,
    incoming: (state) => state.incoming,
    sharesForFile: (state) => (fileId) =>
      state.outgoing.filter((share) => share.fileId && share.fileId._id === fileId),
  },

  mutations: {
    setOutgoing: (state, shares) => {
      state.outgoing = shares;
    },
    setIncoming: (state, shares) => {
      state.incoming = shares;
    },
    removeShare: (state, shareId) => {
      state.outgoing = state.outgoing.filter((share) => share._id !== shareId);
    },
  },
};
