<template>
  <div class="Header">
    <header class="header w-full relative">
      <div class="header-inner flex justify-between items-center relative z-10">
        <div class="left">
          <div class="logo">Audio<span class="highlight">Library</span></div>
        </div>
        <div class="right" v-if="user.loaded">
          <div class="with-dropdown">
            <div class="header-item" @click="toggleMenuHamburguesa">
              <BarsIcon width="32" />
            </div>
          </div>
        </div>
      </div>
      <!-- Menú Hamburguesa -->
      <div class="dropdown-menu" :class="{ desplegado: menuAbierto }">
        <div class="dropdown-item" @click="cerrarSesion">Logout</div>
        <label class="dropdown-toggle">
          <span>Autoplay next</span>
          <input
            type="checkbox"
            v-model="autoplayEnabled"
            @change="onToggleAutoplay"
          />
        </label>
        <label class="dropdown-toggle">
          <span>Play on select</span>
          <input
            type="checkbox"
            v-model="playOnSelectEnabled"
            @change="onTogglePlayOnSelect"
          />
        </label>
        <div class="user-email">{{ user.email }}</div>
      </div>
    </header>
    <div
      v-if="menuAbierto"
      class="header-backdrop"
      @click.self="cerrarMenues"
    ></div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import BarsIcon from "@/components/shared/svg/BarsIcon.vue";
import {
  getAutoplayEnabled,
  setAutoplayEnabled,
  getPlayOnSelectEnabled,
  setPlayOnSelectEnabled,
} from "@/helpers/preferences";
export default {
  name: "Header",
  components: { BarsIcon },
  data() {
    return {
      menuAbierto: false,
      autoplayEnabled: getAutoplayEnabled(),
      playOnSelectEnabled: getPlayOnSelectEnabled(),
    };
  },

  props: {
    user: { type: Object, default: null },
  },

  methods: {
    ...mapMutations({
      logout: "auth/doLogout",
    }),

    cerrarSesion() {
      this.logout();
      this.cerrarMenues();
      this.$router.push({
        path: "/login",
      });
    },

    toggleMenuHamburguesa() {
      this.menuAbierto = !this.menuAbierto;
    },

    cerrarMenues() {
      this.menuAbierto = false;
    },

    onToggleAutoplay() {
      setAutoplayEnabled(this.autoplayEnabled);
    },

    onTogglePlayOnSelect() {
      setPlayOnSelectEnabled(this.playOnSelectEnabled);
    },
  },
};
</script>

<style lang="scss" scoped>
.header-inner {
  background: black;
  z-index: 22;
  height: var(--header-height);
  box-sizing: border-box;
  overflow: hidden;
}

.logo {
  cursor: default;
  user-select: none;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-1-dark);
  padding: 1rem 2rem;
  transition: color 300ms ease-out;
  .highlight {
    font-weight: 600;
    transition: color 300ms ease-out;
    color: var(--color-1);
  }
  &:hover {
    color: var(--color-1);
    .highlight {
      color: var(--color-1-dark);
    }
  }
}

.with-dropdown {
  position: relative;
}

.header-item {
  padding: 1rem 1rem;
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  bottom: 0;
  right: 0;
  overflow: hidden;
  background: var(--color-4);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  z-index: 21;
  transform: translate(0, -100%);
  transition: transform 0.2s ease-out;
}

.dropdown-menu.desplegado {
  transform: translate(0, 100%);
  box-shadow: var(--shadow-md);
}

.dropdown-item {
  cursor: pointer;
  padding: 1.5rem 2rem;
  font-size: 16px;
  &:hover {
    color: var(--color-2);
  }
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  cursor: pointer;
  padding: 1rem 2rem;
  font-size: 16px;
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
}

.user-email {
  padding: 0 2rem 1rem;
  margin-top: -0.75rem;
  font-size: 0.8rem;
  opacity: 0.6;
  white-space: nowrap;
}

.header-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 20;
}
</style>