<template>
  <ModalBox
    v-if="visible"
    title="Search bookmarks"
    max-width="480px"
    @cerrarModal="close"
  >
    <div class="bookmark-search">
      <input
        ref="search-input"
        v-model="query"
        type="text"
        placeholder="Search bookmark labels and notes..."
        @input="onQueryChange"
      />

      <div class="results-list">
        <div v-if="loading" class="status select-none">Searching...</div>
        <div
          v-else-if="query.trim() && !results.length"
          class="status select-none"
        >
          No bookmarks found
        </div>
        <div
          v-for="result in results"
          :key="result._id"
          class="result-row pointer"
          @click="selectResult(result)"
        >
          <div class="result-label">{{ result.label }}</div>
          <div v-if="result.content" class="result-content select-none">
            {{ result.content }}
          </div>
          <div class="result-meta select-none">
            {{ result.folderName }} / {{ result.fileName }} ·
            {{ toHHMMSS(result.time) }}
          </div>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<script>
import ErrorMixin from '@/plugins/error-mixin';
import Helpers from '@/helpers/helper-functions';
import BookmarkController from '@/controller/bookmark-controller';
import ModalBox from '@/components/shared/modal/ModalBox';

export default {
  name: 'BookmarkSearchModal',
  mixins: [ErrorMixin],
  components: { ModalBox },

  data() {
    return {
      visible: false,
      loading: false,
      query: '',
      results: [],
      debounceTimer: null,
    };
  },

  methods: {
    open() {
      this.visible = true;
      this.query = '';
      this.results = [];
      this.$nextTick(() => {
        this.$refs['search-input'].focus();
      });
    },

    close() {
      clearTimeout(this.debounceTimer);
      this.visible = false;
    },

    onQueryChange() {
      clearTimeout(this.debounceTimer);
      const query = this.query.trim();
      if (!query) {
        this.results = [];
        this.loading = false;
        return;
      }
      this.loading = true;
      this.debounceTimer = setTimeout(() => this.search(query), 300);
    },

    async search(query) {
      try {
        const { data } = await BookmarkController.search(query);
        if (query === this.query.trim()) {
          this.results = data.bookmarks;
        }
      } catch (_err) {
        this.toastError(_err);
      } finally {
        this.loading = false;
      }
    },

    selectResult(result) {
      this.$emit('bookmarkSelected', result);
      this.close();
    },

    toHHMMSS: Helpers.toHHMMSS,
  },
};
</script>

<style scoped lang="scss">
.bookmark-search {
  min-height: 300px;
  padding: 1rem 0;
}

input {
  width: 100%;
  font-size: 1rem;
}

.results-list {
  margin-top: 1rem;
}

.status {
  opacity: 0.6;
  padding: 0.5rem 0;
}

.result-row {
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  &:hover {
    color: var(--color-2);
  }
}

.result-label {
  font-weight: bold;
}

.result-content {
  font-size: 0.85rem;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 0.15rem;
}

.result-meta {
  opacity: 0.6;
  font-size: 0.85rem;
}
</style>
