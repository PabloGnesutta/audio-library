<template>
  <div>
    <!-- Single File -->
    <ModalBox
      v-if="movingSingleFile"
      title="Select file's new location"
      @cerrarModal="movingSingleFile = false"
    >
      <div class="modal-content">
        <FolderSelect v-model="selectedFolder" label="Choose a folder" />
        <div v-if="selectedFolder" class="files-list select-none">
          <h4>
            This file will be moved to:
            <span class="highlight"> {{ selectedFolder.name }}</span>
          </h4>
          <div class="file-row">{{ fileToMove.name }}</div>
        </div>
        <button class="btn btn-primary" :disabled="loading" @click="moveFile">
          Move file
        </button>
      </div>
    </ModalBox>

    <!-- Multiple Files -->
    <ModalBox
      v-if="movingMultipleFiles"
      title="Select files' new location"
      @cerrarModal="movingMultipleFiles = false"
    >
      <div class="modal-content">
        <FolderSelect v-model="selectedFolder" label="Select a folder" />
        <div v-if="selectedFolder" class="files-list select-none">
          <h4>
            These files will be moved to:
            <span class="highlight"> {{ selectedFolder.name }}</span>
          </h4>
          <div v-for="file in selectedFiles" :key="file._id" class="file-row">
            {{ file.name }}
          </div>
        </div>
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="moveMultipleFiles"
        >
          Move files
        </button>
      </div>
    </ModalBox>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import eventBus from '@/plugins/event-bus';
import FileController from '@/controller/file-controller';
import ModalBox from '@/components/shared/modal/ModalBox';
import FolderSelect from '@/components/shared/inputs/FolderSelect';

export default {
  name: 'MoveFiles',
  mixins: [ErrorMixin],
  components: { ModalBox, FolderSelect },
  data() {
    return {
      loading: false,
      selectedFolder: null,
      fileToMove: null,
      movingSingleFile: false,
      selectedFiles: [],
      movingMultipleFiles: false,
    };
  },

  mounted() {
    eventBus.$on('moveFiles', this.promptMoveFileFromEventBus);
  },

  methods: {
    ...mapMutations({
      refreshTree: 'tree/refreshTree',
    }),

    promptMoveFileFromEventBus({ files, targetFolder }) {
      this.selectedFiles = files;
      this.selectedFolder = targetFolder;
      this.movingMultipleFiles = true;
    },

    promptMoveFile(file) {
      this.fileToMove = file;
      this.movingSingleFile = true;
    },

    promptMoveMultipleFiles(files) {
      this.selectedFiles = files;
      this.movingMultipleFiles = true;
    },

    async moveFile() {
      try {
        this.$emit('movingFile', this.fileToMove);
        this.loading = true;
        const { data } = await FileController.updateFile(
          this.fileToMove._id,
          'folderId',
          this.selectedFolder.id
        );
        this.loading = false;
        this.$emit('movingFileFinished', this.fileToMove);
        this.refreshTree({ folders: data.folders, files: data.files });
      } catch (_err) {
        this.toastError(_err);
      } finally {
        this.resetState();
      }
    },

    async moveMultipleFiles() {
      const fileIdsList = this.selectedFiles.map((file) => {
        return file._id;
      });

      try {
        this.loading = true;
        this.$emit('moveMultipleFiles');
        const { data } = await FileController.updateMultipleFiles(
          fileIdsList,
          'folderId',
          this.selectedFolder.id
        );
        this.loading = false;
        this.refreshTree({ folders: data.folders, files: data.files });
        this.$emit('moveMultipleFilesFinished');
      } catch (_err) {
        this.toastError(_err);
      } finally {
        this.resetState();
      }
    },

    resetState() {
      this.fileToMove = null;
      this.movingSingleFile = false;
      this.selectedFiles = [];
      this.movingMultipleFiles = false;
    },
  },
};
</script>

<style scoped lang="scss">
.modal-content {
  min-height: 380px;
  padding: 1rem 0;
}

.files-list {
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.06);
  padding: 1rem;
  margin-top: 1rem;
  h4 {
    margin-bottom: 0.75rem;
    font-weight: normal;
  }
  .file-row {
    margin-bottom: 0.5rem;
  }
}

button {
  margin-top: 1rem;
  border-radius: 6px;
}

.highlight {
  color: var(--color-3);
}
</style>
