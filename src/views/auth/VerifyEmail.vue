<template>
  <div class="verify-email">
    <div class="content">
      <div v-if="loading">
        <h2>We are verifying your email address</h2>
        <h3>Please wait a little...</h3>
        <div class="flex justify-center">
          <Spinner radius="60" thickness="4" />
        </div>
      </div>
      <div v-else>
        <div v-if="status === 'success'">
          <h3>Your email was verified correctly!</h3>
          <h4>Please, proceed to login</h4>
          <button class="btn btn-primary" @click="goToLogin">
            Go To Login
          </button>
          <p>
            You will be redirected in
            <span class="time">{{ time }}</span> seconds
          </p>
        </div>
        <div v-else-if="status === 'error'">
          <h4>There was an error while verifying your email.</h4>
          <h4>Please try again later.</h4>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ErrorMixin from '@/plugins/error-mixin';
import AuthController from '@/controller/auth-controller';

export default {
  name: 'VerifyEmail',
  mixins: [ErrorMixin],

  data() {
    return {
      loading: true,
      status: '',
      time: 5,
    };
  },

  mounted() {
    this.verifyEmail();
  },

  methods: {
    async verifyEmail() {
      this.loading = true;
      AuthController.verifyEmail(this.$route.params.token)
        .then((res) => {
          this.status = 'success';
          localStorage.setItem('email', res.data.email);
          this.startInterval();
        })
        .catch((_err) => {
          this.status = 'error';
          this.toastError(_err);
        })
        .finally(() => {
          this.loading = false;
        });
    },

    startInterval() {
      const interval = setInterval(() => {
        if (this.time > 0) {
          this.time--;
        } else {
          this.goToLogin();
          clearInterval(interval);
        }
      }, 1000);
    },
    goToLogin() {
      this.$router.push({ name: 'Login' });
    },
  },
};
</script>

<style scoped lang="scss">
.content {
  user-select: none;
  position: fixed;
  top: 50%;
  left: 50%;
  background: rgb(12, 12, 12);
  color: white;
  transform: translate(-50%, -50%);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  width: 90%;
  max-width: 540px;
  height: 90%;
  max-height: 340px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--color-2);
  transition: all 400ms ease-out;
  &:hover {
    background: black;
    color: white;
  }
}

h2 {
  margin-bottom: 2rem;
}
h3 {
  margin-bottom: 2rem;
}
p {
  margin-top: 1rem;
  .time {
    display: inline-block;
    width: 16px;
    color: var(--color-1);
    font-weight: bold;
  }
}
.btn {
  border-radius: 6px;
  margin-top: 2rem;
}
</style>
