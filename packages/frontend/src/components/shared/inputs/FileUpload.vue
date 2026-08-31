<template>
  <div class="file-upload loading-box" :class="{ minimized }">
    <div v-if="!minimized" class="backdrop" @click.self="closeModal"></div>
    <div class="content">
      <div class="top-bar">
        <div class="placeholder"></div>
        <div class="actions flex items-center">
          <div class="icon" @click="toggleMinimize">&minus;</div>
          <div class="icon" @click="closeModal">&times;</div>
        </div>
      </div>

      <FolderSelect
        v-model="selectedFolder"
        label="Files' destination folder"
        class="folder-select-component"
      />

      <form class="form of-hidden">
        <!-- Files Drag Zone -->
        <div
          class="drop-zone flex flex-col h-auto justify-center items-center"
          @dragover="dragover"
          @dragleave="dragleave"
          @drop="drop"
        >
          <input
            class="file-input"
            multiple
            ref="file"
            type="file"
            accept="audio/*"
            :disabled="uploading"
            :class="{ disabled: uploading }"
            @change="onChange"
          />

          <label
            for="file"
            class="relative color-text-dark pointer font-normal"
            :class="{ disabled: uploading }"
          >
            <p>Drag files or touch here to upload</p>
          </label>
        </div>

        <div class="files-list relative color-text-dark w-full">
          <div
            v-for="(file, fileIndex) in files"
            :key="file.size"
            class="file-row flex items-center justify-between w-full"
            :class="`status-${filesStatus[file.size]}`"
          >
            <span class="file-name"> {{ file.name }} </span>
            <span v-if="uploading" class="flex items-center">
              <span v-if="filesStatus[file.size] === 'uploading'"
                >uploading: {{ filesProgress[file.size] }}% &nbsp;
              </span>
              <span v-if="filesStatus[file.size] === 'processing'"
                >processing &nbsp;
              </span>
              <Spinner
                v-if="
                  filesStatus[file.size] === 'uploading' ||
                  filesStatus[file.size] === 'processing'
                "
                radius="20"
              />
            </span>
            <span
              v-else-if="filesStatus[file.size] !== 'uploaded'"
              class="remove-file-icon"
              @click="removeFile(fileIndex)"
              >&times;</span
            >
            <span v-else-if="filesStatus[file.size] === 'uploaded'"
              >uploaded</span
            >
          </div>
        </div>
        <button
          class="btn btn-primary"
          :disabled="noFileSelected || uploading"
          @click.prevent="uploadFiles"
        >
          {{ noFileSelected ? 'No files selected' : 'Upload Files!' }}
        </button>
      </form>
      <div v-if="minimized" class="minimized-overlay" @click="toggleMinimize">
        <div v-if="uploading">Uploading files: {{ totalProgressPercent }}%</div>
        <div
          v-else-if="files.length"
          class="flex items-center justify-between w-full"
        >
          <span> Selected files: {{ files.length }} </span>
          <span class="close-icon-minimized" @click="closeModal">&times;</span>
        </div>
        <div v-else class="w-full text-center">Uploads</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import FileController from '@/controller/file-controller';
import FolderSelect from '@/components/shared/inputs/FolderSelect';

const maxFileSize = 2 * 1000000000; // Gb
const maxFileSizeStr = maxFileSize / 1000000000 + 'Gb';
const validMimetypes = ['mp3', 'wav', 'mpeg'];
const maxFilesPerUpload = 100; // keep in sync with backend's config.maxFilesPerUpload

export default {
  name: 'FileUpload',
  mixins: [ErrorMixin],
  components: { FolderSelect },

  computed: {
    ...mapGetters({
      tree: 'tree/arbol',
      filesTargetFolder: 'fileUpload/filesTargetFolder',
      filesToUpload: 'fileUpload/filesToUpload',
    }),

    noFileSelected() {
      return this.files.length === 0;
    },
  },

  data() {
    return {
      files: [],
      filesStatus: {},
      filesProgress: {},
      uploadedFiles: 0,
      numFilesToUpload: 0,
      selectedFolder: null,
      totalProgressPercent: 0,
      uploading: false,
      minimized: false,
    };
  },

  mounted() {
    this.validateAndAppend(this.filesToUpload);
    this.selectedFolder = this.filesTargetFolder;
  },

  methods: {
    ...mapMutations({
      addFileToTree: 'tree/addFileToTree',
      setFilesToUpload: 'fileUpload/setFilesToUpload',
      setFilesTargetFolder: 'fileUpload/setFilesTargetFolder',
    }),

    async uploadFiles() {
      if (this.noFileSelected || this.uploading) {
        return;
      }
      if (this.files.length > maxFilesPerUpload) {
        this.pushToast({
          msg: `You can upload up to ${maxFilesPerUpload} files at once (${this.files.length} selected)`,
          success: false,
        });
        return;
      }
      this.numFilesToUpload = this.files.length;
      this.uploading = true;

      const folderId = this.selectedFolder.id;
      const treeIndex = this.tree.findIndex(
        (item) => item.folder.id == folderId
      );

      let uploadUrls;
      try {
        // One batched call for every file's signed URL, instead of one
        // request per file before any of them can start uploading.
        const { data } = await FileController.getUploadUrls(this.files);
        uploadUrls = data.urls;
      } catch (_err) {
        this.toastError(_err);
        this.uploading = false;
        return;
      }

      this.files.forEach((file, i) => {
        // todo: compute duration
        const objectUrl = URL.createObjectURL(file);
        const audio = new Audio(objectUrl);
        audio.ondurationchange = (e) => {
          var duration = e.target.duration;
          if (duration == Infinity) {
            duration = 0;
          }
          this.queueUpload(file, folderId, treeIndex, duration, uploadUrls[i]);
        };
      });

      this.toggleMinimize();
    },

    async queueUpload(file, folderId, treeIndex, duration, uploadInfo) {
      this.filesStatus[file.size] = 'uploading';
      const config = this.progressConfig(file);
      try {
        let { data } = await FileController.uploadFile(
          file,
          config,
          folderId,
          duration,
          uploadInfo
        );
        this.uploadedFiles++;
        this.onFileUploaded(data.file, treeIndex);
        this.filesStatus[file.size] = 'uploaded';
      } catch (_err) {
        this.toastError(_err);
        this.filesStatus[file.size] = 'error';
      } finally {
      }
    },

    onFileUploaded(file, treeIndex) {
      this.addFileToTree({ treeIndex, file });
      if (this.uploadedFiles >= this.numFilesToUpload) {
        this.resetState();
      }
    },

    resetState() {
      this.uploading = false;
      this.files = [];
      this.filesStatus = {};
      this.filesProgress = {};
      this.uploadedFiles = 0;
      this.totalProgressPercent = 0;
      this.setFilesToUpload(null);
      this.setFilesTargetFolder(null);
      document.querySelector('.form').reset();
    },

    progressConfig(file) {
      return {
        onUploadProgress: (e) => {
          const progress = Math.round((e.loaded * 100) / e.total);
          this.filesProgress[file.size] = progress;
          if (progress >= 100) {
            this.filesStatus[file.size] = 'processing';
          }
          this.computeTotalProgress();
        },
      };
    },

    removeFile(index) {
      this.files.splice(index, 1);
    },

    computeTotalProgress() {
      var sumProgress = 0;
      for (const key in this.filesProgress) {
        const progress = this.filesProgress[key];
        sumProgress += progress;
      }
      this.totalProgressPercent = Math.floor(
        sumProgress / this.numFilesToUpload
      );
    },

    dragover(event) {
      event.preventDefault();
      event.currentTarget.classList.add('bg-active');
    },

    dragleave(event) {
      event.currentTarget.classList.remove('bg-active');
    },

    drop(event) {
      event.preventDefault();
      this.validateAndAppend(event.dataTransfer.files);
      event.currentTarget.classList.remove('bg-active');
    },

    onChange(e) {
      if (this.uploading) {
        return;
      }
      this.validateAndAppend(e.target.files);
    },

    validateAndAppend(files) {
      const resultArray = [];
      const filesArray = this.arrayFromFileList(files);
      for (const file of filesArray) {
        const type_mime = file.type.split('/');
        const type = type_mime[0];
        const mime = type_mime[1];
        if (type !== 'audio') {
          console.log(`file type not allowed: (${file.name})`);
          continue;
        }
        if (!validMimetypes.includes(mime)) {
          console.log(`${mime} files are not allowed (${file.name})`);
          continue;
        }
        if (file.size > maxFileSize) {
          console.log(
            `${file.name} exceeds maximum file size (${maxFileSizeStr})`
          );
          continue;
        }
        resultArray.push(file);
      }
      this.files = this.files.concat(resultArray);
    },

    arrayFromFileList(fileList) {
      const files = [];
      for (const file of fileList) {
        files.push(file);
      }
      return files;
    },

    toggleMinimize() {
      this.minimized = !this.minimized;
    },

    closeModal() {
      if (this.uploading) {
        this.minimized = true;
      } else {
        this.setFilesToUpload(null);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.file-upload {
  position: relative;
  z-index: 20;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.75);
}

.content {
  transition: all 300ms ease-out;
  position: fixed;
  width: 90%;
  max-width: 650px;
  bottom: 50%;
  right: 50%;
  transform: translate(50%, 50%);
  transform-origin: left;
  border-radius: 10px;
  padding: 1.5rem;
  background-color: white;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  .actions {
    gap: 1rem;
    .icon {
      font-size: 1.75rem;
      font-weight: bold;
      padding: 0 0.5rem;
      cursor: pointer;
      color: black;
      &:hover {
        color: coral;
      }
    }
  }
}

.minimized .content {
  border-radius: 0;
  width: 170px;
  height: 32px;
  overflow: hidden;
  right: 5px;
  bottom: 5px;
  transform: translate(0, 0);
}

.minimized-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: black;
  background-color: white;
  padding: 0.75rem 0.75rem;
  transition: background-color 200ms ease-out;
  &:hover {
    background-color: #45ff83;
  }
  .close-icon-minimized {
    font-size: 1.5rem;
    font-weight: bold;
    &:hover {
      color: red;
    }
  }
}

.folder-select-component {
  margin-bottom: 1.5rem;
}

.drop-zone {
  border: 2px dashed rgb(121, 121, 121);
  border-radius: 6px;
  position: relative;
  padding: 3rem;
  transition: background-color 200ms ease-out;
  &:hover {
    background-color: #a4e6e6;
  }
  &.bg-active {
    background-color: #a4e6e6;
  }
  label {
    font-size: 1.25rem;
    white-space: normal;
    text-align: center;
    font-weight: normal;
    margin: 1em 0;
    &.disabled {
      cursor: default;
    }
  }
  .file-input {
    opacity: 0;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    padding: 0;
  }
  .file-input:not(:disabled),
  .file-input:not(.disabled) {
    cursor: pointer;
  }
}

// FILES LIST

.files-list {
  margin-top: 0.5rem;
  border-radius: 4px;
  max-height: 30vh;
  overflow-y: auto;
  .file-row {
    background-color: #ebebeb;
    margin-bottom: 0.25rem;
    border-radius: 4px;
    padding-right: 0.75rem;
    cursor: default;
    .file-name {
      padding: 0.75rem;
    }
    &:hover .file-name {
      font-weight: bold;
    }
    .remove-file-icon {
      font-size: 1.75rem;
      font-weight: bold;
      cursor: pointer;
      &:hover {
        color: red;
      }
    }
    &.status-error {
      background-color: red;
    }
    &.status-uploaded {
      background-color: #a4e6e6;
    }
  }
}

.btn {
  margin-top: 1rem;
  border-radius: 6px;
}
</style>
