<template>
  <ModalBox
    title="Create new bookmark"
    max-width="446px"
    @cerrarModal="closeModal"
  >
    <form class="new-bookmark">
      <div class="inputs flex items-center">
        <div>
          <label class="base-label">Label</label>
          <input ref="new-bookmark-label" v-model="label" type="text" />
        </div>
        <div>
          <label class="base-label">Time</label>
          <div class="time select-none">{{ toHHMMSS(currentTime) }}</div>
        </div>
      </div>
      <div class="buttons">
        <div class="btn cancel" @click="closeModal">Cancel</div>
        <button class="btn btn-primary" @click.prevent="addBookmark">
          Confirm
        </button>
      </div>
    </form>
  </ModalBox>
</template>

<script>
import ErrorMixin from '@/plugins/error-mixin';
import Helpers from '@/helpers/helper-functions';
import BookmarkController from '@/controller/bookmark-controller';
import ModalBox from '@/components/shared/modal/ModalBox';

export default {
  name: 'AddBookmarkModal',
  mixins: [ErrorMixin],
  components: { ModalBox },

  props: {
    currentFile: { type: Object, default: null },
    currentTime: { type: Number, default: 0 },
    bookmarksLength: { type: Number, default: 0 },
  },

  data() {
    return {
      label: 'New Bookmark!',
    };
  },

  mounted() {
    this.label = 'Bookmark ' + (this.bookmarksLength + 1);
    this.$nextTick(() => {
      this.$refs['new-bookmark-label'].focus();
      this.$refs['new-bookmark-label'].select();
    });
  },

  methods: {
    async addBookmark() {
      if (!this.label) {
        return alert('Label is required');
      }
      try {
        const { data } = await BookmarkController.create({
          time: this.currentTime,
          label: this.label,
          file: this.currentFile._id,
        });
        this.$emit('bookmarkAdded', data);
      } catch (_err) {
        this.toastError(_err);
      }

      this.closeModal();
    },

    closeModal() {
      this.$emit('closeModal');
    },

    toHHMMSS: Helpers.toHHMMSS,
  },
};
</script>

<style scoped lang="scss">
.new-bookmark {
  display: flex;
  flex-direction: column;
  align-items: center;

  .inputs {
    gap: 0.5rem;
    margin-bottom: 2rem;
    label {
      display: block;
    }
  }

  input,
  .time {
    font-size: 1rem;
  }

  .time {
    padding: 0.75rem;
    background-color: #c5c5c5;
  }

  .buttons {
    display: flex;
    gap: 1em;
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
}
</style>
