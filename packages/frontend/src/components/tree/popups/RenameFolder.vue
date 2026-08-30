<template>
  <div>
    <ModalBox
      v-if="renamingFolder"
      title="Rename Folder"
      evitar-cierre="true"
      @cerrarModal="resetState"
    >
      <form class="flex flex-col">
        <label class="base-label">New folder name:</label>
        <input ref="inputRenameFolder" v-model="folderName" type="text" />
        <button class="btn btn-primary" @click.prevent="renameFolder">
          Confirm
        </button>
      </form>
    </ModalBox>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import UserController from '@/controller/user-controller';
import ModalBox from '@/components/shared/modal/ModalBox';

export default {
  name: 'RenameFolder',
  mixins: [ErrorMixin],
  components: { ModalBox },

  data() {
    return {
      renamingFolder: false,
      folderToRename: null,
      folderName: '',
      treeIndex: null,
    };
  },

  methods: {
    ...mapMutations({
      updateFolderInTree: 'tree/updateFolderInTree',
    }),

    prompt(folder, treeIndex) {
      this.renamingFolder = true;
      this.folderToRename = folder;
      this.folderName = folder.name;
      this.treeIndex = treeIndex;
      this.$nextTick(() => {
        this.$refs.inputRenameFolder.focus();
        this.$refs.inputRenameFolder.select();
      });
    },

    renameFolder() {
      UserController.renameFolder(this.folderToRename.id, this.folderName)
        .then((res) => {
          this.updateFolderInTree({
            treeIndex: this.treeIndex,
            properties: {
              name: this.folderName,
            },
          });
        })
        .catch((_err) => {
          this.toastError(_err);
        })
        .finally(() => {
          this.resetState();
        });
    },

    resetState() {
      this.renamingFolder = false;
      this.folderToRename = null;
      this.folderName = '';
      this.treeIndex = null;
    },
  },
};
</script>

<style scoped lang="scss">
form {
  max-width: 600px;
  margin: auto;
  button {
    margin-top: 1.5rem;
  }
}
</style>
