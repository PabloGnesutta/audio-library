<template>
  <ModalBox
    v-if="open"
    title="Change password"
    max-width="380px"
    @cerrarModal="resetState"
  >
    <form class="change-password-modal" @submit.prevent="save">
      <label>
        Current password
        <input
          ref="current-password-input"
          v-model="currentPassword"
          type="password"
          autocomplete="current-password"
        />
      </label>
      <label>
        New password
        <input
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
        />
      </label>
      <label>
        Confirm new password
        <input
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
        />
      </label>

      <div class="buttons">
        <div class="btn btn-secondary" @click="resetState">Cancel</div>
        <button class="btn btn-primary" type="submit" :disabled="loading">
          Save
        </button>
      </div>
    </form>
  </ModalBox>
</template>

<script>
import ErrorMixin from '@/plugins/error-mixin';
import UserController from '@/controller/user-controller';
import ModalBox from '@/components/shared/modal/ModalBox';

export default {
  name: 'ChangePasswordModal',
  mixins: [ErrorMixin],
  components: { ModalBox },

  data() {
    return {
      loading: false,
      open: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  },

  methods: {
    promptChangePassword() {
      this.open = true;
      this.$nextTick(() => {
        this.$refs['current-password-input'].focus();
      });
    },

    async save() {
      if (this.newPassword !== this.confirmPassword) {
        this.pushToast({ msg: "New passwords don't match" });
        return;
      }
      if (this.newPassword.length < 8) {
        this.pushToast({ msg: 'New password must be at least 8 characters long' });
        return;
      }

      try {
        this.loading = true;
        await UserController.changePassword(this.currentPassword, this.newPassword);
        this.pushToast({ msg: 'Password updated', success: true });
        this.resetState();
      } catch (_err) {
        this.toastError(_err);
      } finally {
        this.loading = false;
      }
    },

    resetState() {
      this.open = false;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    },
  },
};
</script>

<style scoped lang="scss">
.change-password-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.9rem;
}

input {
  width: 100%;
  font-size: 1rem;
}

.buttons {
  display: flex;
  gap: 1em;
  margin-top: 0.5rem;
  .btn {
    border-radius: 6px;
    text-align: center;
  }
}
</style>
