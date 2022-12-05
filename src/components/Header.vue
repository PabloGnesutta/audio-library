<template>
  <div class="Header">
    <header class="header w-full relative">
      <div class="header-inner flex justify-between items-center relative z-10">
        <div class="left">
          <div class="logo">Audio<span class="highlight">Library</span></div>
        </div>
        <div class="right" v-if="user.loaded">
          <div class="dropdown-item" @click="cerrarSesion">Logout</div>
          <!-- <div class="with-dropdown">
            <div class="header-item" @click="toggleMenuHamburguesa">
              <BarsIcon width="32" />
            </div>
          </div> -->
        </div>
      </div>
      <!-- Menú Hamburguesa -->
      <!-- <div
        class="dropdown-menu"
        :class="{ desplegado: mostrarMenuAgregarCarpeta }"
      >
        <div class="dropdown-item">Ajustes</div>
        <div class="dropdown-item" @click="cerrarSesion">Cerrar Sesión</div>
      </div> -->
    </header>
    <!-- <div
      v-if="menuAbierto"
      class="header-backdrop"
      @click.self="cerrarMenues"
    ></div> -->
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import BarsIcon from "@/components/shared/svg/BarsIcon.vue";
export default {
  name: "Header",
  components: { BarsIcon },
  data() {
    return {
      menuAbierto: false,
      mostrarMenuAgregarCarpeta: false,
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
      this.mostrarMenuAgregarCarpeta = !this.mostrarMenuAgregarCarpeta;
      this.menuAbierto = !this.menuAbierto;
    },

    cerrarMenues() {
      this.mostrarMenuAgregarCarpeta = false;
      this.menuAbierto = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.header-inner {
  background: black;
}

.logo {
  cursor: default;
  user-select: none;
  font-size: 1.5rem;
  font-weight: bold;
  color: #9d7c11;
  padding: 1rem 2rem;
  font-family: "Times New Roman", Times, serif;
  transition: color 300ms ease-out;
  .highlight {
    font-style: italic;
    transition: color 300ms ease-out;
    text-decoration: underline;
    color: #ffac0d;
  }
  &:hover {
    color: #ffac0d;
    .highlight {
      // color: #ffc456;
      color: #9d7c11;
    }
  }
}

// .with-dropdown {
//   position: relative;
// }

.header-item {
  padding: 1rem 1rem;
}

// no refactorizo porque eventualmente puede haber más de un elemento

// .dropdown-menu {
//   position: absolute;
//   bottom: 0;
//   right: 0;
//   overflow: hidden;
//   background: var(--color-4);
//   z-index: 6;
//   transform: translate(0, -100%);
//   transition: transform 0.2s ease-out;
// }

// .dropdown-menu.desplegado {
//   transform: translate(0, 100%);
//   box-shadow: 1px -1px 3px 2px #221e1e;
// }

.dropdown-item {
  cursor: pointer;
  padding: 1.5rem 2rem;
  font-size: 16px;
  &:hover {
    color: var(--color-2);
  }
}

// .icon {
//   display: inline-block;
// }

// @media (min-width: 700px) {
//   .header-item {
//     cursor: pointer;
//   }
// }

// .header-backdrop {
//   position: fixed;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   background: transparent;
//   z-index: 5;
// }
</style>