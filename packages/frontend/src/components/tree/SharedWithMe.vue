<template>
  <div v-if="incoming.length" class="shared-with-me">
    <h4 class="section-title select-none">Shared with me</h4>
    <div
      v-for="s in incoming"
      :key="s._id"
      class="shared-file-row pointer"
      @click="openFile(s)"
    >
      <span class="flex-1 file-name">{{ s.fileId.name }}</span>
      <span class="from select-none">from {{ s.owner.name || s.owner.email }}</span>
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

    openFile(share) {
      this.$emit('openSharedFile', share.fileId);
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

  .from {
    font-size: 0.75rem;
    opacity: 0.5;
    margin-left: 0.5rem;
  }

  &:hover {
    color: var(--color-2);
  }
}
</style>
