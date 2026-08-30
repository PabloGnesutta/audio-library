import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router';
import store from '@/store';

import '../public/css/utils.css';
import '../public/css/custom.css';
import '../public/css/globals.css';
import '../public/css/input-range.css';

import Spinner from '@/components/shared/spinner/Spinner.vue';
import dropFilesDirective from '@/directives/v-drop-files';

// Vue.component('Spinner', Spinner);

createApp(App)
  .use(store)
  .use(router)
  .directive('drop-files', dropFilesDirective)
  .component('Spinner', Spinner)
  .mount('#app');
