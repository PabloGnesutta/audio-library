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
      <div class="content-input">
        <label class="base-label">Notes</label>
        <div class="content-input-row">
          <textarea v-model="content" rows="4" placeholder="Take a note..." />
          <span
            v-if="speechSupported"
            class="icon mic pointer"
            :class="{ listening }"
            @click.prevent="toggleListening"
          >
            <MicrophoneIcon width="18" />
          </span>
        </div>
      </div>
      <div class="buttons">
        <div class="btn btn-secondary" @click="closeModal">Cancel</div>
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
import SpeechRecognitionHelper from '@/helpers/SpeechRecognitionHelper';
import BookmarkController from '@/controller/bookmark-controller';
import ModalBox from '@/components/shared/modal/ModalBox';
import MicrophoneIcon from '@/components/shared/svg/MicrophoneIcon';

export default {
  name: 'AddBookmarkModal',
  mixins: [ErrorMixin],
  components: { ModalBox, MicrophoneIcon },

  props: {
    currentFile: { type: Object, default: null },
    currentTime: { type: Number, default: 0 },
    bookmarksLength: { type: Number, default: 0 },
  },

  data() {
    return {
      label: 'New Bookmark!',
      content: '',
      listening: false,
      speechSupported: SpeechRecognitionHelper.isSupported(),
      recognitionHandle: null,
    };
  },

  mounted() {
    this.label = 'Bookmark ' + (this.bookmarksLength + 1);
    this.$nextTick(() => {
      this.$refs['new-bookmark-label'].focus();
      this.$refs['new-bookmark-label'].select();
    });
  },

  beforeUnmount() {
    this.recognitionHandle?.stop();
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
          content: this.content,
          file: this.currentFile._id,
        });
        this.$emit('bookmarkAdded', data);
      } catch (_err) {
        this.toastError(_err);
      }

      this.closeModal();
    },

    toggleListening() {
      if (this.listening) {
        this.recognitionHandle?.stop();
        return;
      }
      this.recognitionHandle = SpeechRecognitionHelper.listenOnce({
        onResult: (transcript) => {
          this.content = this.content ? `${this.content} ${transcript}` : transcript;
        },
        onError: (error) => {
          if (error !== 'aborted' && error !== 'no-speech') {
            this.toastError({ message: 'Speech recognition error: ' + error });
          }
        },
        onEnd: () => {
          this.listening = false;
          this.recognitionHandle = null;
        },
      });
      this.listening = !!this.recognitionHandle;
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
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
  }

  .content-input {
    width: 100%;
    margin-bottom: 2rem;

    label {
      display: block;
    }

    .content-input-row {
      position: relative;

      textarea {
        width: 100%;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        padding-right: 2.5rem;
      }

      .icon.mic {
        position: absolute;
        right: 0.5rem;
        bottom: 0.5rem;
        padding: 0.25rem;
        &:hover {
          color: var(--color-2);
        }
        &.listening {
          color: var(--color-1);
        }
      }
    }
  }

  .buttons {
    display: flex;
    gap: 1em;
    .btn {
      border-radius: 6px;
      text-align: center;
    }
  }
}
</style>
