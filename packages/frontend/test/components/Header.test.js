import { describe, test, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Header from '../../src/components/Header.vue';

function makeStore() {
  const store = createStore({
    modules: {
      auth: {
        namespaced: true,
        state: {},
        mutations: { doLogout: () => {} },
      },
    },
  });
  store.commit = vi.fn();
  return store;
}

function mountHeader() {
  const store = makeStore();
  const wrapper = mount(Header, {
    props: { user: { loaded: true, email: 'user@example.com' } },
    global: {
      plugins: [store],
      stubs: { RouterLink: true },
      mocks: { $router: { push: vi.fn() } },
    },
  });
  return { wrapper, store };
}

describe('Header dropdown menu', () => {
  test('lists "Change password" above "Logout"', () => {
    const { wrapper } = mountHeader();
    const items = wrapper.findAll('.dropdown-item').map((el) => el.text());
    expect(items).toEqual(['Change password', 'Logout']);
  });

  test('clicking "Change password" closes the dropdown and opens the modal', async () => {
    const { wrapper } = mountHeader();
    await wrapper.find('.header-item').trigger('click');
    expect(wrapper.vm.menuAbierto).toBe(true);

    const changePasswordItem = wrapper.findAll('.dropdown-item')
      .find((el) => el.text() === 'Change password');
    await changePasswordItem.trigger('click');

    expect(wrapper.vm.menuAbierto).toBe(false);
    expect(wrapper.findComponent({ name: 'ChangePasswordModal' }).vm.open).toBe(true);
  });
});
