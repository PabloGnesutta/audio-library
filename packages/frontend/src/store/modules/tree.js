function sortByName(array) {
  array.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
}

function refreshTree(state, { folders, files }) {
  state.arbol = [];
  state.folders = folders;

  // `files` is omitted when bootstrapping a session -- folders are shown
  // right away and each one's files are fetched lazily as it's opened
  // (see `setFolderFiles`). When `files` is provided (e.g. after moving a
  // file or editing its tags) every folder is populated up front, same as
  // before.
  if (files) {
    const sortedFiles = [...files];
    sortByName(sortedFiles);

    state.folders.forEach((folder) => {
      const treeFiles = sortedFiles.filter((file) => {
        return file.folderId == folder.id;
      });
      state.arbol.push({ folder, files: treeFiles, loaded: true });
    });
  } else {
    state.folders.forEach((folder) => {
      state.arbol.push({ folder, files: [], loaded: false });
    });
  }
  state.currentFolder = state.folders[0];
}

export default {
  namespaced: true,

  state: {
    arbol: [],
    folders: null,
    currentFolder: null,
  },

  getters: {
    arbol: (state) => state.arbol,
    folders: (state) => state.folders,
    currentFolder: (state) => state.currentFolder,
    allTags: (state) => {
      const tags = new Set();
      state.arbol.forEach((item) => {
        item.files.forEach((file) => {
          (file.tags || []).forEach((tag) => tags.add(tag));
        });
      });
      return [...tags].sort();
    },
  },

  mutations: {
    refreshTree: (state, { folders, files }) => {
      refreshTree(state, { folders, files });
    },

    addFolderToTree: (state, folder) => {
      //todo: insert sorted
      state.folders.push(folder);
      state.arbol.push({ folder, files: [], loaded: true });
    },
    updateFolderInTree: (state, { treeIndex, properties }) => {
      const treeFolder = state.arbol[treeIndex].folder;
      const folder = state.folders.find(folder => folder.id == treeFolder.id);
      for (const key in properties) {
        folder[key] = properties[key];
        treeFolder[key] = properties[key];
      }
    },
    removeFolderFromTree: (state, treeIndex) => {
      state.arbol.splice(treeIndex, 1);
    },

    addFileToTree: (state, { treeIndex, file }) => {
      state.arbol[treeIndex].files.push(file);
      sortByName(state.arbol[treeIndex].files);
    },
    setFolderFiles: (state, { treeIndex, files }) => {
      const sortedFiles = [...files];
      sortByName(sortedFiles);
      state.arbol[treeIndex].files = sortedFiles;
      state.arbol[treeIndex].loaded = true;
    },
    updateFileCurrentTimeInTree: (state, { treeIndex, fileIndex, currentTime }) => {
      const file = state.arbol[treeIndex].files[fileIndex];
      file.metaData.currentTime = currentTime;
    },
    removeFileFromTree: (state, { treeIndex, fileIndex }) => {
      state.arbol[treeIndex].files.splice(fileIndex, 1);
    },

    setCurrentFolder: (state, payload) => {
      state.currentFolder = payload;
    },
  },
};
