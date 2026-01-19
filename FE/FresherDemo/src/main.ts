import { createApp } from 'vue'
import FloatingVue from 'floating-vue'
import './assets/css/font.css'
import 'floating-vue/dist/style.css'
import './style.css'
import './assets/css/icon.css'
import './assets/css/buttons.css'
import './assets/css/inputs.css'
import router from './router';
import pinia from './store';
import App from './App.vue'
import { PrimeVue } from '@primevue/core'
import { ConfirmationService, ToastService } from 'primevue'

const app = createApp(App);
app.use(FloatingVue);
app.use(PrimeVue, {
    unstyled: true,
});
app.use(ConfirmationService);
app.use(ToastService);

app.use(router);
app.use(pinia);
app.mount('#app');