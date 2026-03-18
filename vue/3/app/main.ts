import {createApp} from 'vue';
import App from './App.vue';
import {router} from './router';
import {mionClient} from './mion-client';
import './assets/main.css';

const app = createApp(App);
app.use(router);
app.provide('mionClient', mionClient);
app.mount('#app');
