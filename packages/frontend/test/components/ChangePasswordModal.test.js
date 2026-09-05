import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ChangePasswordModal from '../../src/components/ChangePasswordModal.vue';
import UserController from '../../src/controller/user-controller';
import eventBus from '../../src/plugins/event-bus';

vi.mock('../../src/controller/user-controller', () => ({
  default: {
    changePassword: vi.fn(),
  },
}));

function mountModal() {
  return mount(ChangePasswordModal);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ChangePasswordModal', () => {
  test('is not rendered until prompted', () => {
    const wrapper = mountModal();
    expect(wrapper.findComponent({ name: 'ModalBox' }).exists()).toBe(false);
  });

  test('promptChangePassword opens the modal', async () => {
    const wrapper = mountModal();
    await wrapper.vm.promptChangePassword();
    expect(wrapper.findComponent({ name: 'ModalBox' }).exists()).toBe(true);
  });

  test('save() rejects mismatched new passwords without calling the API', async () => {
    const toasts = [];
    eventBus.$on('push_toast', (t) => toasts.push(t));
    const wrapper = mountModal();
    await wrapper.vm.promptChangePassword();
    wrapper.vm.currentPassword = 'current';
    wrapper.vm.newPassword = 'newpassword1';
    wrapper.vm.confirmPassword = 'somethingelse';

    await wrapper.vm.save();

    expect(UserController.changePassword).not.toHaveBeenCalled();
    expect(toasts).toContainEqual({ msg: "New passwords don't match", success: false });
  });

  test('save() rejects a too-short new password without calling the API', async () => {
    const toasts = [];
    eventBus.$on('push_toast', (t) => toasts.push(t));
    const wrapper = mountModal();
    await wrapper.vm.promptChangePassword();
    wrapper.vm.currentPassword = 'current';
    wrapper.vm.newPassword = 'short';
    wrapper.vm.confirmPassword = 'short';

    await wrapper.vm.save();

    expect(UserController.changePassword).not.toHaveBeenCalled();
    expect(toasts).toContainEqual({
      msg: 'New password must be at least 8 characters long',
      success: false,
    });
  });

  test('save() calls the API and resets state on success', async () => {
    UserController.changePassword.mockResolvedValue({});
    const wrapper = mountModal();
    await wrapper.vm.promptChangePassword();
    wrapper.vm.currentPassword = 'current';
    wrapper.vm.newPassword = 'newpassword1';
    wrapper.vm.confirmPassword = 'newpassword1';

    await wrapper.vm.save();

    expect(UserController.changePassword).toHaveBeenCalledWith('current', 'newpassword1');
    expect(wrapper.vm.open).toBe(false);
    expect(wrapper.vm.currentPassword).toBe('');
  });

  test('save() surfaces an API error via toastError without resetting the form', async () => {
    UserController.changePassword.mockRejectedValue({ response: { data: 'Current password is incorrect' } });
    const wrapper = mountModal();
    await wrapper.vm.promptChangePassword();
    wrapper.vm.currentPassword = 'wrong';
    wrapper.vm.newPassword = 'newpassword1';
    wrapper.vm.confirmPassword = 'newpassword1';

    await wrapper.vm.save();

    expect(wrapper.vm.open).toBe(true);
    expect(wrapper.vm.currentPassword).toBe('wrong');
  });
});
