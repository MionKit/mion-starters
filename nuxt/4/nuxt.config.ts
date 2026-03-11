import {createMionPlugin} from './api/mion-plugin';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: {enabled: true},
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      mionApiUrl: '',
    },
  },

  vite: {
    plugins: [
      createMionPlugin(),
    ],
  },
})
