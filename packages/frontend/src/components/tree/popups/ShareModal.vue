<template>
  <ModalBox v-if="open" title="Share file" max-width="446px" @cerrarModal="resetState">
    <div class="share-modal">
      <p class="file-name-label">{{ file && file.name }}</p>

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

      <div class="shares-list">
        <p v-if="!fileShares.length" class="no-shares select-none">
          Not shared with anyone yet
        </p>
        <div v-for="s in fileShares" :key="s._id" class="share-row flex items-center">
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
      file: null,
      recipientEmail: '',
    };
  },

  computed: {
    ...mapGetters({
      sharesForFile: 'share/sharesForFile',
    }),
    fileShares() {
      return this.file ? this.sharesForFile(this.file._id) : [];
    },
  },

  methods: {
    ...mapMutations({
      setOutgoing: 'share/setOutgoing',
      removeShareFromStore: 'share/removeShare',
    }),

    async promptShareFile(file) {
      this.file = file;
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
        await ShareController.shareFile(this.file._id, email);
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
      this.file = null;
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

.file-name-label {
  margin-bottom: 1rem;
  opacity: 0.8;
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
