<template>
  <div class="file-search">
    <input
      v-model="query"
      type="text"
      class="file-search-input"
      placeholder="Search files..."
      @input="onQueryChange"
    />
    <div v-if="query.trim()" class="results-list">
      <div v-if="loading" class="status select-none">Searching...</div>
      <div v-else-if="!results.length" class="status select-none">
        No files found
      </div>
      <div
        v-for="result in results"
        :key="result._id"
        class="result-row pointer"
        @click="selectResult(result)"
      >
        <div class="result-name">{{ result.name }}</div>
        <div class="result-meta select-none">{{ result.folderName }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import ErrorMixin from "@/plugins/error-mixin";
import FileController from "@/controller/file-controller";

export default {
  name: "FileSearchBox",
  mixins: [ErrorMixin],

  data() {
    return {
      query: "",
      results: [],
      loading: false,
      debounceTimer: null,
    };
  },

  methods: {
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
        const { data } = await FileController.search(query);
        if (query === this.query.trim()) {
          this.results = data.files;
        }
      } catch (_err) {
        this.toastError(_err);
      } finally {
        this.loading = false;
      }
    },

    selectResult(result) {
      this.$emit("fileSelected", result);
      clearTimeout(this.debounceTimer);
      this.query = "";
      this.results = [];
    },
  },
};
</script>

<style scoped lang="scss">
.file-search {
  position: relative;
  padding: 0.5rem 1rem;
}

.file-search-input {
  width: 100%;
  font-size: 0.95rem;
}

.results-list {
  position: absolute;
  left: 1rem;
  right: 1rem;
  top: 100%;
  z-index: 11;
  background: #333;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  max-height: 300px;
  overflow-y: auto;
  box-shadow: var(--shadow-md);
}

.status {
  opacity: 0.6;
  padding: 0.5rem 1rem;
}

.result-row {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  &:hover {
    color: var(--color-2);
  }
}

.result-name {
  font-weight: bold;
}

.result-meta {
  opacity: 0.6;
  font-size: 0.85rem;
}
</style>
