<template>
  <ModalBox
    v-if="editingFile"
    :title="`Tags for ${editingFile.name}`"
    max-width="446px"
    @cerrarModal="resetState"
  >
    <div class="tags-modal">
      <div class="tags-list">
        <span v-for="tag in tags" :key="tag" class="tag-chip">
          {{ tag }}
          <span class="remove pointer" @click="removeTag(tag)">&times;</span>
        </span>
        <span v-if="!tags.length" class="no-tags select-none">No tags yet</span>
      </div>

      <input
        ref="new-tag-input"
        v-model="newTag"
        type="text"
        placeholder="Add a tag and press Enter"
        list="all-tags-datalist"
        @keydown.enter.prevent="addTag"
        @keydown.,.prevent="addTag"
      />
      <datalist id="all-tags-datalist">
        <option v-for="tag in allTags" :key="tag" :value="tag" />
      </datalist>

      <div class="buttons">
        <div class="btn cancel" @click="resetState">Cancel</div>
        <button class="btn btn-primary" :disabled="loading" @click="save">
          Save
        </button>
      </div>
    </div>
  </ModalBox>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import FileController from '@/controller/file-controller';
import ModalBox from '@/components/shared/modal/ModalBox';

export default {
  name: 'TagsModal',
  mixins: [ErrorMixin],
  components: { ModalBox },

  data() {
    return {
      loading: false,
      editingFile: null,
      tags: [],
      newTag: '',
    };
  },

  computed: {
    ...mapGetters({
      allTags: 'tree/allTags',
    }),
  },

  methods: {
    ...mapMutations({
      refreshTree: 'tree/refreshTree',
    }),

    promptEditTags(file) {
      this.editingFile = file;
      this.tags = [...(file.tags || [])];
      this.$nextTick(() => {
        this.$refs['new-tag-input'].focus();
      });
    },

    addTag() {
      const tag = this.newTag.trim().toLowerCase();
      this.newTag = '';
      if (!tag || this.tags.includes(tag)) return;
      this.tags.push(tag);
    },

    removeTag(tag) {
      this.tags = this.tags.filter((t) => t !== tag);
    },

    async save() {
      try {
        this.loading = true;
        const { data } = await FileController.updateFile(
          this.editingFile._id,
          'tags',
          this.tags
        );
        this.refreshTree({ folders: data.folders, files: data.files });
        this.resetState();
      } catch (_err) {
        this.toastError(_err);
      } finally {
        this.loading = false;
      }
    },

    resetState() {
      this.editingFile = null;
      this.tags = [];
      this.newTag = '';
    },
  },
};
</script>

<style scoped lang="scss">
.tags-modal {
  min-height: 200px;
  padding: 1rem 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  min-height: 2rem;
}

.no-tags {
  color: #777;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: #c5c5c5;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;

  .remove {
    font-weight: bold;
    &:hover {
      color: var(--color-3);
    }
  }
}

input {
  width: 100%;
  font-size: 1rem;
}

.buttons {
  display: flex;
  gap: 1em;
  margin-top: 1.5rem;
  .btn {
    border-radius: 6px;
    text-align: center;
    &.cancel {
      border: 1px solid #333;
    }
    &.cancel:hover {
      border: 1px solid black;
    }
  }
}
</style>
