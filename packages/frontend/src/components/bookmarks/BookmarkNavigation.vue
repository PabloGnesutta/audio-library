<template>
  <div class="bookmark-navigation p-1">
    <!-- Agregar Marcador -->
    <div class="add-bookmark-btn-container">
      <button class="btn btn-primary" @click.prevent="openAddBookmarkModal">
        <AddBookmarkIcon width="30" />
      </button>
    </div>

    <h4 class="heading"><span class="underline">Bookmarks</span></h4>

    <div class="no-bookmarks" v-if="bookmarks.length === 0">
      &nbsp; There are no bookmarks for this file yet
    </div>

    <div class="bookmarks-list">
      <div
        v-for="(bookmark, b) in bookmarks"
        :key="bookmark._id"
        class="flex justify-between items-center"
        @mouseenter="onMouseenter(bookmark)"
        @mouseleave="onMouseleave(bookmark)"
      >
        <!-- left -->
        <div class="left" @click="goToBookmark(bookmark)">
          <div v-if="!bookmakrsBeignEdited[b]">
            <div>
              <span> {{ toHHMMSS(bookmark.time) }} | </span>
              <span>{{ bookmark.label }}</span>
            </div>
            <div v-if="bookmark.content" class="bookmark-content select-none">
              {{ bookmark.content }}
            </div>
          </div>
          <div v-else>
            <form class="edit-bookmark-form">
              <input :ref="'label_' + b" v-model="editableLabel" type="text" />
              <div class="content-input-row">
                <textarea
                  v-model="editableContent"
                  rows="3"
                  placeholder="Take a note..."
                />
                <span
                  v-if="speechSupported"
                  class="icon mic pointer"
                  :class="{ listening }"
                  @click.prevent="toggleListening"
                >
                  <MicrophoneIcon width="16" />
                </span>
              </div>
              <button @click.prevent="confirmEdit(b)" hidden></button>
            </form>
          </div>
        </div>

        <!-- right -->
        <div class="right" v-if="!bookmakrsBeignEdited[b]">
          <span class="icon edit" @click="startEdit(b)"
            ><PenIcon width="16" />
          </span>
          <span class="icon delete" @click="deleteBookmark(bookmark, b)"
            ><RemoveBookmarkIcon width="16" />
          </span>
        </div>
        <div class="right" v-else>
          <span class="icon confirm" @click="confirmEdit(b)"
            ><CheckIcon width="16"
          /></span>
          <span class="icon cancel" @click="stopEdit(b)"
            ><CancelIcon width="16"
          /></span>
        </div>
      </div>
    </div>

    <AddBookmarkModal
      v-if="showAddBookmarkModal"
      :current-file="currentFile"
      :current-time="currentTime"
      :bookmarks-length="bookmarks.length"
      @bookmarkAdded="bookmarkAdded"
      @closeModal="closeAddBookmarkModal"
    />
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import eventBus from '@/plugins/event-bus';
import Helpers from '@/helpers/helper-functions';
import SpeechRecognitionHelper from '@/helpers/SpeechRecognitionHelper';
import BookmarkController from '@/controller/bookmark-controller';

import AddBookmarkModal from '@/components/bookmarks/AddBookmarkModal';
import TimeInput from '@/components/shared/inputs/TimeInput';
import PenIcon from '@/components/shared/svg/PenIcon';
import CheckIcon from '@/components/shared/svg/CheckIcon';
import CancelIcon from '@/components/shared/svg/CancelIcon';
import AddBookmarkIcon from '@/components/shared/svg/AddBookmarkIcon.vue';
import RemoveBookmarkIcon from '@/components/shared/svg/RemoveBookmarkIcon';
import MicrophoneIcon from '@/components/shared/svg/MicrophoneIcon';

export default {
  name: 'BookmarkNavigation',
  mixins: [ErrorMixin],
  components: {
    AddBookmarkModal,
    TimeInput,
    PenIcon,
    CheckIcon,
    CancelIcon,
    AddBookmarkIcon,
    RemoveBookmarkIcon,
    MicrophoneIcon,
  },
  props: {
    bookmarks: { type: Array, default: null },
    currentFile: { type: Object, default: null },
  },
  data() {
    return {
      editing: false,
      editableLabel: '',
      editableContent: '',
      bookmakrsBeignEdited: [],
      showAddBookmarkModal: false,
      listening: false,
      speechSupported: SpeechRecognitionHelper.isSupported(),
      recognitionHandle: null,
    };
  },
  computed: {
    ...mapGetters({
      currentTime: 'audioPlayer/flooredCurrentTime',
    }),
  },
  mounted() {
    this.bookmakrsBeignEdited = this.bookmarks.map((b) => {
      return false;
    });
  },

  beforeUnmount() {
    this.recognitionHandle?.stop();
  },

  methods: {
    ...mapMutations({
      setAvoidKeyListeners: 'setAvoidKeyListeners',
    }),

    goToBookmark(bookmark) {
      if (this.editing) return;
      eventBus.$emit('setCurrentTime', bookmark.time);
    },

    openAddBookmarkModal() {
      this.setAvoidKeyListeners(true);

      const time = this.currentTime;
      const bookmark = this.bookmarks.find((b) => b.time === time);
      if (bookmark) {
        alert('A bookmark for the given time already exists');
        return;
      }

      this.showAddBookmarkModal = true;
    },

    bookmarkAdded(data) {
      this.$emit('bookmarkAdded', data);
    },

    async deleteBookmark(bookmark, index) {
      if (this.editing) return;
      if (!confirm('Es seguro que querés eliminar este marcador?')) {
        return;
      }
      try {
        await BookmarkController.deleteBookmark(bookmark._id);
        this.$emit('bookmarkDeleted', index);
      } catch (_err) {
        this.toastError(_err);
      }
    },

    startEdit(index) {
      if (this.editing) return;
      this.setAvoidKeyListeners(true);

      this.editableLabel = this.bookmarks[index].label;
      this.editableContent = this.bookmarks[index].content || '';
      this.bookmakrsBeignEdited[index] = true;

      this.editing = true;

      this.$nextTick(() => {
        this.$refs['label_' + index][0].focus();
        this.$refs['label_' + index][0].select();
      });
    },

    async confirmEdit(index) {
      console.log('complete edit', this.bookmarks[index], this.editableLabel);
      try {
        const { data } = await BookmarkController.updateBookmark(
          this.bookmarks[index]._id,
          { label: this.editableLabel, content: this.editableContent }
        );
        this.$emit('bookmarkUpdated', { index, data });
      } catch (_err) {
        this.toastError(_err);
      }

      this.stopEdit(index);
    },

    stopEdit(index) {
      this.recognitionHandle?.stop();
      this.editing = false;
      this.bookmakrsBeignEdited[index] = false;
      this.setAvoidKeyListeners(false);
    },

    toggleListening() {
      if (this.listening) {
        this.recognitionHandle?.stop();
        return;
      }
      this.recognitionHandle = SpeechRecognitionHelper.listenOnce({
        onResult: (transcript) => {
          this.editableContent = this.editableContent
            ? `${this.editableContent} ${transcript}`
            : transcript;
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

    closeAddBookmarkModal() {
      this.showAddBookmarkModal = false;
      this.setAvoidKeyListeners(false);
    },

    onMouseenter(bookmark) {
      document.querySelector('.bm_' + bookmark._id).classList.add('highlight');
    },
    onMouseleave(bookmark) {
      document
        .querySelector('.bm_' + bookmark._id)
        .classList.remove('highlight');
    },

    toHHMMSS: Helpers.toHHMMSS,
  },
};
</script>

<style lang="scss" scoped>
.bookmark-navigation {
  background: #222;
}

.add-bookmark-btn-container {
  display: flex;
  justify-content: center;
  margin: 1em 0;
  .btn-primary {
    display: flex;
    align-items: center;
    height: 60px;
    width: 60px;
    border-radius: 30%;
  }
}

.heading {
  cursor: default;
  margin-bottom: 1rem;
}

.underline {
  border-bottom: 1px solid var(--color-1);
}

.bookmarks-list {
  .left {
    margin-right: 1rem;
    cursor: pointer;
    &:hover {
      color: var(--color-2);
    }

    .bookmark-content {
      margin-top: 0.25rem;
      font-size: 0.85rem;
      opacity: 0.7;
      white-space: pre-wrap;
    }

    .edit-bookmark-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .content-input-row {
        position: relative;

        textarea {
          width: 100%;
          font-family: inherit;
          font-size: 0.9rem;
          resize: vertical;
          padding-right: 2.25rem;
        }

        .icon.mic {
          position: absolute;
          right: 0.4rem;
          bottom: 0.4rem;
          padding: 0.2rem;
          &:hover {
            color: var(--color-2);
          }
          &.listening {
            color: var(--color-1);
          }
        }
      }
    }
  }

  .right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    .icon {
      padding: 0.75rem;
      padding-right: 0;
      cursor: pointer;
      &:hover {
        color: var(--color-2);
      }
    }
  }
}
</style>
