<template>
  <div>
    <div
      class="folder-row flex justify-between items-center"
      :class="{ selected }"
      v-drop-files="{ folder }"
    >
      <!-- left -->
      <div class="left pointer of-x-scroll" @click="onFolderClick">
        <FolderOpenIcon v-if="unfolded" width="24" />
        <FolderIcon v-else width="24" />
        <span class="folder-name select-none"> {{ folder.name }} </span>
      </div>

      <!-- right -->
      <div class="right border-w-2 border-solid border-transparent">
        <div class="action-icons">
          <span class="icon pointer" @click="promptRenameFolder">
            <PenIcon width="20" />
          </span>
          <span class="icon pointer" @click="promptShareFolder">
            <ShareIcon width="18" />
          </span>
          <span class="icon pointer" @click="promptDeleteFolder">
            <TrashIcon width="20" />
          </span>
        </div>
      </div>
    </div>
    <RenameFolder ref="renameFolder" />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import UserController from '@/controller/user-controller';
import RenameFolder from '@/components/tree/popups/RenameFolder';
import PenIcon from '@/components/shared/svg/PenIcon';
import TrashIcon from '@/components/shared/svg/TrashIcon';
import FolderIcon from '@/components/shared/svg/FolderIcon';
import FolderOpenIcon from '@/components/shared/svg/FolderOpenIcon';
import ShareIcon from '@/components/shared/svg/ShareIcon';

export default {
  name: 'FolderRow',
  mixins: [ErrorMixin],
  components: { RenameFolder, FolderIcon, FolderOpenIcon, PenIcon, TrashIcon, ShareIcon },

  data() {
    return {
      deleting: false,
    };
  },
  props: ['folder', 'files', 'treeIndex', 'selected', 'unfolded'],

  methods: {
    ...mapMutations({
      removeFolderFromTree: 'tree/removeFolderFromTree',
    }),

    promptRenameFolder() {
      this.$refs.renameFolder.prompt(this.folder, this.treeIndex);
    },

    promptShareFolder() {
      this.$emit('openFolderShareMenu', this.folder);
    },

    promptDeleteFolder() {
      if (!confirm(`Sure you want to delete ${this.folder.name}?`)) return;
      const numFiles = this.files.length;
      if (numFiles)
        if (!confirm(`${numFiles} files will be deleted. Confirm?`)) return;

      this.deleteFolder();
    },

    async deleteFolder() {
      try {
        // todo: add deleting status
        await UserController.deleteFolder(this.folder.id);
        this.removeFolderFromTree(this.treeIndex);
      } catch (_err) {
        this.toastError(_err);
      }
    },

    onFolderClick() {
      this.$emit('onFolderClick');
    },
  },
};
</script>

<style lang="scss" scoped>
.folder-row {
  gap: 1rem;
  padding: 0.25rem 0.5rem;
  font-size: 1.2rem;
  border: 2px dashed transparent;
  transition: background-color 200ms ease-out;
  background-color: #0c0c0c;
  color: #f0e2bc;
  &.selected {
    background-color: #787878;
  }

  &:hover {
    background-color: #514f4f;
  }

  &.dragging-over {
    border-color: #dedede;
    background-color: #1e4648;
  }

  .left {
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .right {
    .action-icons {
      display: flex;
      gap: 0.25rem;
      .icon {
        padding: 0.25rem 0.5rem;
        &:hover {
          color: var(--color-2);
        }
      }
    }
  }

  .folder-icon {
    width: 24px;
  }
}
</style>
