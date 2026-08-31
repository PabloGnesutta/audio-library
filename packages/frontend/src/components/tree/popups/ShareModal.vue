<template>
  <ModalBox v-if="open" :title="modalTitle" max-width="446px" @cerrarModal="resetState">
    <div class="share-modal">
      <p v-if="mode !== 'multiple'" class="resource-name-label">{{ resource && resource.name }}</p>
      <div v-else class="files-list select-none">
        <div v-for="file in resources" :key="file._id" class="file-row">
          {{ file.name }}
        </div>
      </div>

      <div class="share-form flex items-center">
        <input
          ref="email-input"
          v-model="recipientEmail"
          type="email"
          placeholder="Recipient's email"
          @keydown.enter.prevent="share"
        />
        <button class="btn btn-primary" :disabled="loading" @click="share">
          Share
        </button>
      </div>

      <div v-if="mode !== 'multiple'" class="shares-list">
        <p v-if="!currentShares.length" class="no-shares select-none">
          Not shared with anyone yet
        </p>
        <div v-for="s in currentShares" :key="s._id" class="share-row flex items-center">
          <span class="flex-1">{{ s.sharedWith && (s.sharedWith.name || s.sharedWith.email) }}</span>
          <span class="remove pointer" @click="revoke(s)">&times;</span>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import ShareController from '@/controller/share-controller';
import ModalBox from '@/components/shared/modal/ModalBox';

export default {
  name: 'ShareModal',
  mixins: [ErrorMixin],
  components: { ModalBox },

  data() {
    return {
      loading: false,
      open: false,
      mode: null, // 'file' | 'folder' | 'multiple'
      resource: null, // the file or folder object being shared
      resources: [], // files being shared, when mode === 'multiple'
      recipientEmail: '',
    };
  },

  computed: {
    ...mapGetters({
      sharesForResource: 'share/sharesForResource',
    }),
    currentShares() {
      const id = this.mode === 'file' ? this.resource?._id : this.resource?.id;
      return this.resource ? this.sharesForResource(this.mode, id) : [];
    },
    modalTitle() {
      if (this.mode === 'folder') return 'Share folder';
      if (this.mode === 'multiple') return `Share ${this.resources.length} files`;
      return 'Share file';
    },
  },

  methods: {
    ...mapMutations({
      setOutgoing: 'share/setOutgoing',
      removeShareFromStore: 'share/removeShare',
    }),

    async promptShareFile(file) {
      this.mode = 'file';
      this.resource = file;
      await this.openModal();
    },

    async promptShareFolder(folder) {
      this.mode = 'folder';
      this.resource = folder;
      await this.openModal();
    },

    async promptShareMultipleFiles(files) {
      this.mode = 'multiple';
      this.resources = files;
      await this.openModal();
    },

    async openModal() {
      this.open = true;
      this.$nextTick(() => {
        this.$refs['email-input']?.focus();
      });
      await this.refreshOutgoing();
    },

    async refreshOutgoing() {
      try {
        const { data } = await ShareController.getOutgoing();
        this.setOutgoing(data.shares);
      } catch (_err) {
        this.toastError(_err);
      }
    },

    async share() {
      const email = this.recipientEmail.trim();
      if (!email) return;
      try {
        this.loading = true;
        if (this.mode === 'folder') {
          await ShareController.shareFolder(this.resource.id, email);
        } else if (this.mode === 'multiple') {
          await Promise.all(
            this.resources.map((file) => ShareController.shareFile(file._id, email))
          );
          this.$emit('multipleFilesShared');
        } else {
          await ShareController.shareFile(this.resource._id, email);
        }
        await this.refreshOutgoing();
        this.recipientEmail = '';
      } catch (_err) {
        this.toastError(_err);
      } finally {
        this.loading = false;
      }
    },

    async revoke(share) {
      try {
        await ShareController.revoke(share._id);
        this.removeShareFromStore(share._id);
      } catch (_err) {
        this.toastError(_err);
      }
    },

    resetState() {
      this.open = false;
      this.mode = null;
      this.resource = null;
      this.resources = [];
      this.recipientEmail = '';
    },
  },
};
</script>

<style scoped lang="scss">
.share-modal {
  min-height: 200px;
  padding: 1rem 0;
}

.resource-name-label {
  margin-bottom: 1rem;
  opacity: 0.8;
}

.files-list {
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.06);
  padding: 1rem;
  margin-bottom: 1.5rem;
  .file-row {
    margin-bottom: 0.5rem;
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.share-form {
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  input {
    flex: 1;
    font-size: 1rem;
  }
  button {
    border-radius: 6px;
  }
}

.no-shares {
  color: rgba(255, 255, 255, 0.4);
}

.share-row {
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .remove {
    font-weight: bold;
    &:hover {
      color: var(--color-2);
    }
  }
}
</style>
