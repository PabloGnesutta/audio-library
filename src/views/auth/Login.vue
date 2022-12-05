<template>
  <div class="login">
    <div v-if="showLogin" class="form-container">
      <div class="heading">
        <h3>Welcome!</h3>
        <h4>Login to the application</h4>
      </div>

      <form>
        <label for="email">Email</label>
        <input
          ref="loginEmail"
          v-model="loginEmail"
          :disabled="loading"
          type="email"
          name="email"
          placeholder="example@mail.com"
        />
        <label for="password">Password</label>
        <input
          ref="loginPassword"
          v-model="loginPassword"
          :disabled="loading"
          type="password"
          name="password"
        />
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click.prevent="login"
        >
          LOGIN
        </button>
      </form>
      <p @click="switchForm">
        Don't have an account yet? <span class="underline">Create one!</span>
      </p>
    </div>

    <div v-else class="form-container">
      <div class="heading">
        <h3>Create an account</h3>
        <h4 class="placeholder select-none">Create a new account</h4>
      </div>
      <form>
        <label for="email">Email</label>
        <input
          ref="signupEmail"
          v-model="signupEmail"
          :disabled="loading"
          type="text"
          name="email"
          placeholder="example@mail.com"
        />
        <label for="password">Password</label>
        <input
          ref="signupPassword"
          v-model="signupPassword"
          :disabled="loading"
          type="password"
          name="password"
        />
        <button
          class="btn btn-secondary"
          :disabled="loading"
          @click.prevent="signup"
        >
          SIGNUP
        </button>
      </form>
      <p @click="switchForm">
        Already have an account? <span class="underline">Login!</span>
      </p>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import ErrorMixin from '@/plugins/error-mixin';
import AuthController from '@/controller/auth-controller';

export default {
  name: 'Login',
  mixins: [ErrorMixin],

  data() {
    return {
      loading: false,
      signupEmail: '',
      signupPassword: '',
      loginEmail: '',
      loginPassword: '',
      showLogin: true,
    };
  },

  mounted() {
    this.focusLogin();
  },

  methods: {
    ...mapMutations({
      setUser: 'auth/setUser',
      setAccessToken: 'auth/setAccessToken',
      setRefreshToken: 'auth/setRefreshToken',
      refreshTree: 'tree/refreshTree',
    }),

    // TODO: field validation

    async signup() {
      if (!this.signupEmail || !this.signupPassword) return;

      this.loading = true;
      AuthController.signup(this.signupEmail, this.signupPassword)
        .then((res) => {
          this.pushToast({
            msg: 'Account successfully created, check your email inbox',
            success: true,
          });
        })
        .catch((_err) => {
          this.toastError(_err);
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async login() {
      if (!this.loginEmail || !this.loginPassword) return;

      this.loading = true;
      AuthController.login(this.loginEmail, this.loginPassword)
        .then((res) => {
          const { user, folders, files } = res.data;
          this.setUser(user);
          this.refreshTree({ folders, files });
          localStorage.setItem('email', res.data.user.email);
          this.setAccessToken(res.data.accessToken);
          this.setRefreshToken(res.data.refreshToken);
          this.$router.push({
            path: '/',
          });
        })
        .catch((_err) => {
          console.error(_err);
          this.toastError(_err);
        })
        .finally(() => {
          this.loading = false;
        });
    },

    switchForm() {
      this.showLogin = !this.showLogin;
      if (this.showLogin) {
        this.focusLogin();
      } else {
        this.$nextTick(() => {
          this.$refs.signupEmail.select();
          this.$refs.signupEmail.focus();
        });
      }
    },

    focusLogin() {
      this.$nextTick(() => {
        if (localStorage.getItem('email')) {
          this.loginEmail = localStorage.getItem('email');
          this.$refs.loginPassword.select();
          this.$refs.loginPassword.focus();
        } else {
          this.$refs.loginEmail.select();
          this.$refs.loginEmail.focus();
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.login {
  height: calc(100vh - var(--header-height));
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #0d0d0d;
}

.heading {
  margin-bottom: 1.75rem;
  h3 {
    margin-bottom: 0.5rem;
  }
  .placeholder {
    color: transparent;
  }
}

.form-container {
  padding: 1em;
  width: 90%;
  max-width: 600px;
}

form {
  display: flex;
  flex-direction: column;
  label {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  input {
    border-radius: 6px;
    color: black;
    background-color: white;
    margin-bottom: 1.75rem;
    font-size: 1.25rem;
  }
  button {
    border-radius: 6px;
    margin-top: 1rem;
  }
}
p {
  margin-top: 1.5rem;
  cursor: pointer;
  color: var(--color-1);
  font-weight: bold;
  &:hover {
    color: var(--color-2);
  }
}
.underline {
  text-decoration: underline;
}
</style>
