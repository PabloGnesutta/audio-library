<template>
  <div>
    <ModalBox
      v-if="creatingFolder"
      titulo="Create new folder"
      evitar-cierre="true"
      @cerrarModal="resetState"
    >
      <form class="flex flex-col">
        <label class="base-label">Folder Name:</label>
        <input ref="inputCreateFolder" v-model="folderName" type="text" />
        <button class="btn btn-primary" @click.prevent="addFolder">
          Create Folder
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
  name: 'AddFolder',
  mixins: [ErrorMixin],
  components: { ModalBox },

  data() {
    return {
      folderName: '',
      creatingFolder: false,
    };
  },

  methods: {
    ...mapMutations({
      addFolderToTree: 'tree/addFolderToTree',
    }),

    prompt() {
      this.creatingFolder = true;
      this.$nextTick(() => {
        this.$refs.inputCreateFolder.focus();
      });
    },

    addFolder() {
      if (!this.folderName) return;
      UserController.createFolder(this.folderName)
        .then((res) => {
          this.folderName = '';
          this.addFolderToTree(res.data);
        })
        .catch((_err) => {
          this.toastError(_err);
        })
        .finally(() => {
          this.resetState();
        });
    },

    resetState() {
      this.folderName = '';
      this.creatingFolder = false;
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
