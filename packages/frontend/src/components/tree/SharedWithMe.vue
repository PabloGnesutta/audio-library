<template>
  <div v-if="incoming.length" class="shared-with-me">
    <h4 class="section-title select-none">Shared with me</h4>

    <div v-for="s in incoming" :key="s._id" class="shared-item">
      <!-- file share -->
      <div
        v-if="s.resourceType === 'file'"
        class="shared-file-row pointer"
        @click="openFile(s.fileId)"
      >
        <span class="flex-1 file-name">{{ s.fileId.name }}</span>
        <span class="from select-none">from {{ s.owner.name || s.owner.email }}</span>
      </div>

      <!-- folder share -->
      <div v-else class="shared-folder">
        <div class="shared-file-row pointer" @click="toggleFolder(s)">
          <span class="flex-1 file-name"
            >{{ expandedShareId === s._id ? '▾' : '▸' }} {{ s.folderName || 'Folder' }}</span
          >
          <span class="from select-none">from {{ s.owner.name || s.owner.email }}</span>
        </div>
        <div v-if="expandedShareId === s._id" class="shared-folder-files">
          <p v-if="!folderFiles[s._id]" class="loading select-none">Loading...</p>
          <p v-else-if="!folderFiles[s._id].length" class="loading select-none">
            No files in this folder
          </p>
          <template v-else>
            <div
              v-for="file in folderFiles[s._id]"
              :key="file._id"
              class="shared-file-row nested pointer"
              @click="openFile(file)"
            >
              <span class="file-name">{{ file.name }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import ShareController from '@/controller/share-controller';

export default {
  name: 'SharedWithMe',
  mixins: [ErrorMixin],

  data() {
    return {
      expandedShareId: null,
      folderFiles: {},
    };
  },

  computed: {
    ...mapGetters({
      incoming: 'share/incoming',
    }),
  },

  mounted() {
    this.fetchIncoming();
  },

  methods: {
    ...mapMutations({
      setIncoming: 'share/setIncoming',
    }),

    async fetchIncoming() {
      try {
        const { data } = await ShareController.getIncoming();
        this.setIncoming(data.shares);
      } catch (_err) {
        this.toastError(_err);
      }
    },

    async toggleFolder(share) {
      if (this.expandedShareId === share._id) {
        this.expandedShareId = null;
        return;
      }
      this.expandedShareId = share._id;
      if (this.folderFiles[share._id]) return;

      try {
        const { data } = await ShareController.getSharedFolderFiles(share._id);
        this.folderFiles = { ...this.folderFiles, [share._id]: data.files };
      } catch (_err) {
        this.toastError(_err);
      }
    },

    openFile(file) {
      this.$emit('openSharedFile', file);
    },
  },
};
</script>

<style scoped lang="scss">
.shared-with-me {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.section-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 0.5rem;
}

.shared-file-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0;

  &.nested {
    padding-left: 1.25rem;
  }

  .from {
    font-size: 0.75rem;
    opacity: 0.5;
    margin-left: 0.5rem;
  }

  &:hover {
    color: var(--color-2);
  }
}

.shared-folder-files {
  .loading {
    padding-left: 1.25rem;
    opacity: 0.5;
    font-size: 0.85rem;
  }
}
</style>
