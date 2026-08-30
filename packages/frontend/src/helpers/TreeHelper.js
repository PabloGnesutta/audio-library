import store from '@/store';


export default {
  treeIndexByFolderId(folderId) {
    const arbol = store.state.tree.arbol;
    return arbol.findIndex((item) => item.folder.id == folderId);
  },

  indexesByFileId(fileId) {
    const arbol = store.state.tree.arbol;
    for (var a = 0; a < arbol.length; a++) {
      const item = arbol[a];
      const files = item.files;
      for (var f = 0; f < files.length; f++) {
        const file = files[f];
        if (file._id === fileId) {
          return { treeIndex: a, fileIndex: f };
        }
      }
    }
    return { treeIndex: -1, fileIndex: -1 };
  },
};
