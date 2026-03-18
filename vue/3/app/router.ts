import {createRouter, createWebHistory} from 'vue-router';
import HomePage from './pages/HomePage.vue';
import MionOrdersPage from './pages/MionOrdersPage.vue';

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: HomePage},
        {path: '/mion-orders', component: MionOrdersPage},
    ],
});
