<template>
  <div class="home relative">
    <div class="home-inner" v-if="user.loaded">
      <div class="sidebar-and-main-wraper">
        <SidebarAndMain ref="sidebarAndMain">
          <template v-slot:sidebar class="sidebar-slot">
            <TreeNavigation
              ref="treeNavigation"
              :lastFileSeen="user.lastFileSeen"
              @fileSelected="onFileSelected"
              @ocultarSidebar="hideSidebar"
            />
          </template>
          <template
            class="main-wrapper"
            v-slot:main
            v-drop-files="{ folder: currentFolder }"
          >
            <!-- <div v-if="!loading" class="audio-player-wraper m-auto"> -->
            <div v-if="currentFile" class="audio-player-wraper m-auto">
              <p class="reproduciendo text-center mb-2">
                Reproduciendo:
                <span class="color-2">{{ currentFile.name }} </span>
              </p>

              <AudioPlayer
                ref="audioPlayer"
                :audio-url="audioUrl"
                :file-type="currentFile.type"
                :file-name="currentFile.name"
                :start-at="currentFile.metaData.currentTime"
                :bookmarks="bookmarks"
                @updateCurrentTime="updateCurrentTime"
                @verAnterior="selectPrevious"
                @verSiguiente="selectNext"
              />
            </div>
            <div class="bookmarks-wrapper">
              <BookmarkNavigation
                v-if="bookmarks"
                :bookmarks="bookmarks"
                :current-file="currentFile"
                @bookmarkAdded="onBookmarkAdded"
                @bookmarkDeleted="onBookmarkDeleted"
                @bookmarkUpdated="onBookmarkUpdated"
              />
            </div>

            <!-- Files Drag Zone -->
            <div class="dropzone-wrapper flex items-center justify-center">
              <div class="dropzone flex items-center justify-center">
                Drop 'em files!
              </div>
            </div>
          </template>
        </SidebarAndMain>
      </div>
    </div>

    <FileUpload v-if="filesToUpload" />
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import FileController from '@/controller/file-controller';
import BookmarkController from '@/controller/bookmark-controller';
import SidebarAndMain from '@/layouts/SidebarAndMain';
import TreeNavigation from '@/components/tree/TreeNavigation.vue';
import AudioPlayer from '@/components/audio-player/AudioPlayer.vue';
import BookmarkNavigation from '@/components/bookmarks/BookmarkNavigation';
import FileUpload from '@/components/shared/inputs/FileUpload';

export default {
  name: 'Home',
  mixins: [ErrorMixin],
  components: {
    SidebarAndMain,
    TreeNavigation,
    AudioPlayer,
    BookmarkNavigation,
    FileUpload,
  },

  data() {
    return {
      loading: true,
      currentFile: null,
      currentTreeIndex: null,
      currentFileIndex: null,
      filesAudioUrlCache: {},
      fileBookmarksCache: [],
      bookmarks: null,
      audioUrl: '',
    };
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
      arbol: 'tree/arbol',
      currentFolder: 'tree/currentFolder',
      filesToUpload: 'fileUpload/filesToUpload',
    }),
  },

  mounted() {
    console.log(this.user);
    console.log(this.arbol);
    console.log(this.currentFile);
  },

  methods: {
    ...mapMutations({
      updateFileCurrentTimeInTree: 'tree/updateFileCurrentTimeInTree',
    }),

    onBookmarkAdded(bookmark) {
      this.fileBookmarksCache[this.currentFile._id].push(bookmark);
      this.sortAndSetBookmarks();
    },

    onBookmarkDeleted(index) {
      this.fileBookmarksCache[this.currentFile._id].splice(index, 1);
      this.sortAndSetBookmarks();
    },

    onBookmarkUpdated({ index, data }) {
      this.fileBookmarksCache[this.currentFile._id][index] = data.bookmark;
      this.bookmarks = this.fileBookmarksCache[this.currentFile._id];
      this.$refs.audioPlayer.refreshBookmarks();
    },

    sortAndSetBookmarks() {
      this.fileBookmarksCache[this.currentFile._id].sort(function (a, b) {
        if (a.time < b.time) return -1;
        if (a.time > b.time) return 1;
        return 0;
      });
      this.bookmarks = this.fileBookmarksCache[this.currentFile._id];
      this.$refs.audioPlayer.refreshBookmarks();
    },

    async updateCurrentTime({ currentTime, refreshCache }) {
      if (currentTime > 0) {
        try {
          await FileController.updateMetadata(
            this.currentFile._id,
            'currentTime',
            currentTime
          );
          this.updateFileCurrentTimeInTree({
            currentTime,
            treeIndex: this.currentTreeIndex,
            fileIndex: this.currentFileIndex,
          });
        } catch (_err) {
          this.toastError(_err);
        }
      }
      if (refreshCache) {
        delete this.filesAudioUrlCache[this.currentFile._id];
        this.getFileUrl(this.currentFile);
      }
    },

    // todo: check race condition with file ulr and bookmarks
    async getFileBookmakrs(file) {
      const bookmarksCache = this.fileBookmarksCache[file._id];
      if (bookmarksCache) {
        this.bookmarks = bookmarksCache;
        return;
      }
      try {
        const { data } = await BookmarkController.getForFile(file._id);
        const { bookmarks } = data;
        this.bookmarks = bookmarks;
        this.fileBookmarksCache[file._id] = bookmarks;
      } catch (_err) {
        this.toastError(_err);
      }
    },

    async getFileUrl(file) {
      const audioUrlCache = this.filesAudioUrlCache[file._id];
      if (audioUrlCache) {
        this.audioUrl = audioUrlCache;
        this.$nextTick(() => {
          this.$refs.audioPlayer.init();
        });
        return;
      }
      try {
        const { data } = await FileController.getUrl(file._id, file.folderId);
        const { url } = data;
        this.audioUrl = url;
        this.filesAudioUrlCache[file._id] = url;
        this.$nextTick(() => {
          this.$refs.audioPlayer.init();
        });
      } catch (_err) {
        this.toastError(_err);
      }
    },

    getFileUrlAndBookmarks(file) {
      this.getFileUrl(file);
      this.getFileBookmakrs(file);
    },

    onFileSelected({ treeIndex, fileIndex }) {
      this.currentFile = this.arbol[treeIndex].files[fileIndex];
      this.currentTreeIndex = treeIndex;
      this.currentFileIndex = fileIndex;
      this.arbol[treeIndex].folder.lastFileSeen = this.currentFile._id;

      this.getFileUrlAndBookmarks(this.currentFile);
    },

    selectPrevious() {
      const index = this.currentFileIndex - 1;
      if (index >= 0) {
        this.$refs.treeNavigation.openFileWithIndexes(
          this.currentTreeIndex,
          index
        );
      } else {
        console.log('first file on folder');
      }
    },

    selectNext() {
      const index = this.currentFileIndex + 1;
      if (index < this.arbol[this.currentTreeIndex].files.length) {
        this.$refs.treeNavigation.openFileWithIndexes(
          this.currentTreeIndex,
          index
        );
      } else {
        console.log('last file on folder');
      }
    },

    hideSidebar() {
      this.$refs.sidebarAndMain.toggleSidebar();
    },
  },
};
</script>

<style scoped lang="scss">
.sidebar-slot {
  height: 100%;
}

.main-wrapper {
  min-height: calc(100vh - var(--header-height));
  &.dragging-over .dropzone-wrapper {
    visibility: visible;
    opacity: 1;
  }
}

.audio-player-wraper {
  padding-top: 4rem;
  max-width: 600px;
}

.bookmarks-wrapper {
  margin: auto;
  padding-top: 4rem;
  max-width: 600px;
}

.dropzone-wrapper {
  position: absolute;
  pointer-events: none;
  user-select: none;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100vh - var(--header-height));
  background: rgba(0, 0, 0, 1);
  z-index: 15;
  visibility: hidden;
  opacity: 0;
  transition: opacity 200ms ease-out;
  .dropzone {
    width: 100%;
    height: calc(90vh - var(--header-height));
    border: 3px dashed #8af2e2;
    pointer-events: none;
    font-size: 2rem;
  }
}
</style>
