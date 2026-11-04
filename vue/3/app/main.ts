import {createApp} from 'vue';
import {createRouter, createWebHistory, RouterView} from 'vue-router';
import HomePage from './pages/HomePage.vue';
import MionOrdersPage from './pages/MionOrdersPage.vue';
import './assets/main.css';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: HomePage},
        {path: '/mion-orders', component: MionOrdersPage},
    ],
});

createApp(RouterView).use(router).mount('#app');
