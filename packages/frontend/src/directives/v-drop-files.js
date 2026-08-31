import store from '@/store';
import eventBus from '@/plugins/event-bus';

export default {
  mounted(el, binding) {
    const targetFolder = binding.value.folder;

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.currentTarget.classList.add("dragging-over");
    });

    el.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove("dragging-over");
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      // Stop the drop from bubbling to an ancestor's own v-drop-files (e.g.
      // dropping on a FolderRow inside .folders-container, which also has
      // the directive) -- otherwise both handlers fire for one drop and the
      // ancestor's overwrites the more specific target folder just set.
      e.stopPropagation();
      onDrop(e, targetFolder);
    });
  },
};

function onDrop(e, targetFolder) {
  store.commit('fileUpload/setFilesTargetFolder', targetFolder);

  const newFiles = e.dataTransfer.files;
  const inAppFiles = e.dataTransfer.getData('text/plain');
  if (inAppFiles) {
    const data = JSON.parse(inAppFiles);
    if (data.originFolder) {
      // single file
      if (data.originFolder.id == targetFolder.id) {
        console.warn('Same folder, nothing will happen');
      }
    }
    eventBus.$emit('moveFiles', { files: data.files, targetFolder });
  } else if (newFiles.length) {
    // todo: validate files type and size
    store.commit('fileUpload/setFilesToUpload', newFiles);
  } else {
    console.warn('Nothing relevant has been dragged');
  }

  e.dataTransfer.clearData();
  e.currentTarget.classList.remove("dragging-over");
}