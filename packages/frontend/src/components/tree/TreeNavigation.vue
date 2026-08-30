<template>
  <div class="tree-navigation">
    <!-- TREE HEADER -->
    <div class="tree-header bg-4 color-text m-0">
      <!-- left -->
      <div class="left flex items-center">
        <span class="sidebar-hider p-0.5" @click="hideSidebar"
          ><ArrowLeftIcon width="30"
        /></span>

        <h3 class="inline-block p-0.5 default">Files</h3>
      </div>

      <!-- right -->
      <div class="right tree-header-actions flex items-center">
        <span class="icon" @click="openFileUpload">
          <UploadIcon width="28" />
        </span>
        <span class="icon" @click="promptAddFolder">
          <FolderPlusIcon width="28" />
        </span>
      </div>
    </div>

    <!-- TAG FILTER -->
    <div v-if="allTags.length" class="tag-filter-row flex items-center">
      <span
        v-for="tag in allTags"
        :key="tag"
        class="tag-chip pointer"
        :class="{ active: activeTagFilters.includes(tag) }"
        @click="toggleTagFilter(tag)"
        >{{ tag }}</span
      >
    </div>

    <!-- FOLDERS -->
    <div class="folders-container">
      <div
        class="folder-row-wrapper"
        v-for="(item, treeIndex) in _tree"
        :key="item.folder.id"
        :class="{ desplegada: foldersStatus[treeIndex] === 'DESPLEGADA' }"
      >
        <FolderRow
          :unfolded="foldersStatus[treeIndex] === 'DESPLEGADA'"
          :folder="item.folder"
          :files="item.files"
          :treeIndex="treeIndex"
          :selected="currentFolder.id === item.folder.id"
          @onFolderClick="toggleFolder(treeIndex)"
        />
        <!-- FILES -->
        <div
          class="files-wrapper h-auto of-y-hidden"
          v-drop-files="{ folder: item.folder }"
          @click="selectFolder(item.folder)"
        >
          <div
            v-for="(file, fileIndex) in item.files"
            v-show="fileMatchesTagFilter(file)"
            :key="file._id"
            draggable="true"
            @dragstart="onFileDragStart($event, item.folder, file)"
          >
            <FileRow
              :file="file"
              :active="activeFile._id === file._id"
              :is-last-seen="item.folder.lastFileSeen == file._id"
              :status="filesStatus[file._id]"
              @openFile="openFileWithIndexes(treeIndex, fileIndex)"
              @openFileMoveMenu="openFileMoveMenu"
              @openFileTagsMenu="openFileTagsMenu"
              @deleteFile="deleteFile(file)"
              @toggleFileSelected="toggleFileSelected(file, $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <AddFolder ref="addFolder" />
    <MoveFiles
      ref="moveFiles"
      @movingFile="onMovingFile"
      @moveMultipleFiles="onMoveMultipleFiles"
      @movingFileFinished="onMovingFileFinished"
      @moveMultipleFilesFinished="moveMultipleFilesFinished"
    />
    <TagsModal ref="tagsModal" />

    <!-- multiple-file actions -->
    <div
      class="multiple-file-actions flex items-center"
      :class="{ visible: selectedFiles.length }"
    >
      <div class="left flex items-center">
        <span class="info select-none"
          >{{ selectedFiles.length }} files selected</span
        >
      </div>
      <div class="right flex items-center">
        <span class="icon" @click="openMoveMultipleFilesMenu">
          <FolderIcon width="26" />
        </span>
        <span class="icon" @click="deleteMultipleFiles">
          <TrashIcon width="26" />
        </span>
      </div>
    </div>
    <div class="drag-image files-wrapper">
      <div
        v-for="file in selectedFiles"
        :key="file._id"
        class="file-drag-image"
      >
        {{ file.name }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import FileController from '@/controller/file-controller';
import TreeHelper from '@/helpers/TreeHelper';

import ModalBox from '@/components/shared/modal/ModalBox';
import UploadIcon from '@/components/shared/svg/UploadIcon';
import FolderSelect from '@/components/shared/inputs/FolderSelect';
import FileRow from '@/components/tree/FileRow';
import FolderRow from '@/components/tree/FolderRow';
import AddFolder from '@/components/tree/popups/AddFolder';
import MoveFiles from '@/components/tree/popups/MoveFiles';
import TagsModal from '@/components/tree/popups/TagsModal';
import ArrowLeftIcon from '@/components/shared/svg/ArrowLeftIcon';
import FolderIcon from '@/components/shared/svg/FolderIcon';
import FolderPlusIcon from '@/components/shared/svg/FolderPlusIcon';
import TrashCanIcon from '@/components/shared/svg/TrashCanIcon';
import TrashIcon from '@/components/shared/svg/TrashIcon';

export default {
  name: 'TreeNavigation',
  mixins: [ErrorMixin],
  components: {
    ModalBox,
    UploadIcon,
    FileRow,
    FolderRow,
    FolderSelect,
    AddFolder,
    MoveFiles,
    TagsModal,
    ArrowLeftIcon,
    FolderIcon,
    FolderPlusIcon,
    TrashIcon,
    TrashCanIcon,
  },
  data() {
    return {
      foldersStatus: [],
      activeFile: {},
      selectedFiles: [],
      filesStatus: {},
      activeTagFilters: [],
    };
  },

  props: ['lastFileSeen', 'lastFolderSeen'],

  computed: {
    ...mapGetters({
      _tree: 'tree/arbol',
      currentFolder: 'tree/currentFolder',
      allTags: 'tree/allTags',
    }),
  },

  mounted() {
    this.initialize(true);
  },

  methods: {
    ...mapMutations({
      refreshTree: 'tree/refreshTree',
      setCurrentFolder: 'tree/setCurrentFolder',
      updateFolderInTree: 'tree/updateFolderInTree',
      removeFileFromTree: 'tree/removeFileFromTree',
      removeFolderFromTree: 'tree/removeFolderFromTree',
      setFilesTargetFolder: 'fileUpload/setFilesTargetFolder',
      setFilesToUpload: 'fileUpload/setFilesToUpload',
      setFolderFiles: 'tree/setFolderFiles',
    }),

    onFileDragStart(e, originFolder, file) {
      if (this.selectedFiles.length) {
        const dragImage = document.querySelector('.drag-image');
        e.dataTransfer.setDragImage(dragImage, 10, 10);
        e.dataTransfer.setData(
          'text/plain',
          JSON.stringify({ files: this.selectedFiles })
        );
      } else {
        e.dataTransfer.setData(
          'text/plain',
          JSON.stringify({ originFolder, files: [file] })
        );
      }
    },

    initialize(initPlaybackAfterParse) {
      if (initPlaybackAfterParse && this.lastFileSeen) {
        this.openLastFileSeen(this.lastFileSeen, this.lastFolderSeen);
      }
    },

    selectFolder(folder) {
      this.setCurrentFolder(folder);
    },

    async loadFolderFiles(treeIndex) {
      const item = this._tree[treeIndex];
      if (!item || item.loaded) return;
      try {
        const { data } = await FileController.getFilesForFolder(item.folder.id);
        this.setFolderFiles({ treeIndex, files: data.files });
      } catch (_err) {
        this.toastError(_err);
      }
    },

    async toggleFolder(i) {
      this.selectFolder(this._tree[i].folder);
      const nuevoEstado =
        this.foldersStatus[i] === 'DESPLEGADA' ? 'PLEGADA' : 'DESPLEGADA';
      this.foldersStatus[i] = nuevoEstado;
      if (nuevoEstado === 'DESPLEGADA') {
        await this.loadFolderFiles(i);
      }
    },

    promptAddFolder() {
      this.$refs.addFolder.prompt();
    },

    openFileMoveMenu(file) {
      this.$refs.moveFiles.promptMoveFile(file);
    },

    openFileTagsMenu(file) {
      this.$refs.tagsModal.promptEditTags(file);
    },

    toggleTagFilter(tag) {
      const index = this.activeTagFilters.indexOf(tag);
      if (index === -1) {
        this.activeTagFilters.push(tag);
      } else {
        this.activeTagFilters.splice(index, 1);
      }
    },

    fileMatchesTagFilter(file) {
      if (!this.activeTagFilters.length) return true;
      return (file.tags || []).some((tag) =>
        this.activeTagFilters.includes(tag)
      );
    },
    onMovingFile(file) {
      this.filesStatus[file._id] = 'moving';
    },
    onMovingFileFinished(file) {
      this.filesStatus[file._id] = 'undefined';
    },

    openMoveMultipleFilesMenu() {
      this.$refs.moveFiles.promptMoveMultipleFiles(this.selectedFiles);
    },
    onMoveMultipleFiles() {
      this.selectedFiles.forEach((file) => {
        this.filesStatus[file._id] = 'moving';
      });
    },
    moveMultipleFilesFinished() {
      this.selectedFiles.forEach((file) => {
        this.filesStatus[file._id] = 'undefined';
      });
      this.selectedFiles = [];
    },

    async deleteFile(file, promptConfirm = true, unselectFilesAfterDelete) {
      if (promptConfirm) {
        if (!confirm(`Sure you want to delete ${file.name}?`)) return;
      }
      try {
        this.filesStatus[file._id] = 'deleting';

        const { data } = await FileController.deleteFile(file._id);
        const { treeIndex, fileIndex } = TreeHelper.indexesByFileId(
          data.fileId
        );

        if (treeIndex === -1 || fileIndex === -1) {
          return console.error('File not found in tree');
        }

        this.removeFileFromTree({ treeIndex, fileIndex });
        delete this.filesStatus[file._id];

        if (unselectFilesAfterDelete) {
          const index = this.selectedFiles.findIndex((f) => f._id === file._id);
          this.unselectFile(index);
        }
      } catch (_err) {
        this.toastError(  _err );
      }
    },

    deleteMultipleFiles() {
      if (!confirm(`${this.selectedFiles.length} will be deleted. Confirm?`)) {
        return;
      }
      this.selectedFiles.forEach((file) => {
        this.deleteFile(file, false, true);
      });
    },

    //select file and open containg folder
    async openLastFileSeen(fileId, folderId) {
      const treeIndex = TreeHelper.treeIndexByFolderId(folderId);
      if (treeIndex === -1) return;

      await this.loadFolderFiles(treeIndex);

      const { fileIndex } = TreeHelper.indexesByFileId(fileId);
      if (fileIndex === -1) return;

      this.openFileWithIndexes(treeIndex, fileIndex);
      this.toggleFolder(treeIndex);
    },

    // needs improvement
    openFileWithIndexes(treeIndex, fileIndex) {
      this.setActiveFile(this._tree[treeIndex].files[fileIndex]);
      this.$emit('fileSelected', { treeIndex, fileIndex });
    },

    setActiveFile(file) {
      this.activeFile = file;
    },

    toggleFileSelected(file, selected) {
      if (selected) {
        this.selectedFiles.push(file);
      } else {
        const index = this.selectedFiles.findIndex((f) => f._id === file._id);
        this.selectedFiles.splice(index, 1);
      }
    },

    unselectFile(index) {
      this.selectedFiles.splice(index, 1);
    },

    openFileUpload() {
      this.setFilesToUpload([]);
      this.setFilesTargetFolder(this.currentFolder);
    },

    hideSidebar() {
      this.$emit('ocultarSidebar');
    },
  },
};
</script>

<style lang="scss" scoped>
.drag-image {
  position: absolute;
  z-index: -999;
  background: var(--color-1);
  color: black;
  .file-drag-image {
    padding: 0.75rem;
  }
}
.tree-navigation {
  --tree-header-height: 64px;
  height: 100%;
  position: relative;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .tree-header-actions {
    gap: 0.5rem;
    .icon {
      cursor: pointer;
      padding: 1rem 0.5rem;
      &:hover {
        color: var(--color-2);
      }
    }
  }
}

.tag-filter-row {
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  .tag-chip {
    background-color: #333;
    color: #dfdfdf;
    border-radius: 999px;
    padding: 0.15rem 0.7rem;
    font-size: 0.8rem;
    &:hover {
      color: var(--color-2);
    }
    &.active {
      background-color: var(--color-1);
      color: black;
    }
  }
}

.folders-container {
  position: relative;
  padding-bottom: 5em;
  overflow-y: scroll;
  height: calc(100vh - var(--header-height) - var(--tree-header-height));
  &::-webkit-scrollbar {
    width: 12px;
    height: 0;
    background: rgb(34, 34, 34);
  }
  &::-webkit-scrollbar-thumb {
    width: 16px;
    height: 0;
    background: teal;
    &:hover {
      background: rgb(0, 173, 173);
    }
  }
}

.files-wrapper {
  border: 2px dashed transparent;
  transition: background-color 200ms ease-out;
  &:not(.drag-image) {
    height: 0;
  }
  &.dragging-over {
    border-color: white;
    background-color: #1e4648;
  }
}

.folder-row-wrapper.desplegada .files-wrapper {
  height: auto;
}

.multiple-file-actions {
  justify-content: space-between;
  gap: 1rem;
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  background: #d6d6d6;
  font-weight: bold;
  padding: 1.5rem 1rem;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  transition: transform 250ms ease-out;
  transform: translateY(100%);
  &.visible {
    transform: translateY(0);
  }
  .left {
    .info {
      color: black;
    }
  }
  .right {
    gap: 1rem;
  }
  .icon {
    color: black;
    cursor: pointer;
    &:hover {
      color: var(--color-3);
    }
  }
}

@media screen and (min-width: 700px) {
  .sidebar-hider {
    display: none;
  }
}
</style>
