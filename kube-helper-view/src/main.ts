import { createApp } from 'vue';
import './style.css'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import { BluePreset } from './utils/themePreset';
import router from './Router';
import { loadPrimeComponents } from './utils/loadComponents';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

TimeAgo.addDefaultLocale(en)

const app = createApp(App);
app.use(router);
app.use(PrimeVue, 
{
    theme: {
        preset: BluePreset,
        options: {
            darkModeSelector: '.dark-kube',
            
        }
    }
});

loadPrimeComponents(app);

app.mount('#kube-helper-app')
