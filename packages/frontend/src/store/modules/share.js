export default {
  namespaced: true,

  state: {
    outgoing: [],
    incoming: [],
  },

  getters: {
    outgoing: (state) => state.outgoing,
    incoming: (state) => state.incoming,
    sharesForResource: (state) => (resourceType, id) =>
      state.outgoing.filter((share) => {
        if (share.resourceType !== resourceType) return false;
        return resourceType === 'file' ? share.fileId && share.fileId._id === id : share.folderId === id;
      }),
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
