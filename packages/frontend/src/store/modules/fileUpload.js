
export default {
  namespaced: true,

  state: {
    filesToUpload: null,
    filesTargetFolder: null,
  },

  getters: {
    filesToUpload: (state) => state.filesToUpload,
    filesTargetFolder: (state) => state.filesTargetFolder,
  },

  mutations: {
    setFilesToUpload: (state, payload) => {
      state.filesToUpload = payload;
    },
    setFilesTargetFolder: (state, payload) => {
      state.filesTargetFolder = payload;
    },
  },
};
