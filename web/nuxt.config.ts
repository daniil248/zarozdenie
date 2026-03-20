// https://nuxt.com/docs/api/configuration/nuxt-config
const appBase = process.env.NUXT_APP_BASE_URL || '/'
const baseWithSlash = appBase.endsWith('/') ? appBase : `${appBase}/`

export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@formkit/nuxt'
  ],
  formkit: {
    // Experimental support for auto loading (see note):
    autoImport: true
  },
  i18n: {
    // Канонический URL (для GitHub Pages: NUXT_PUBLIC_SITE_URL=https://daniil248.github.io/zarozdenie)
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://new-origin.kz',
    locales: [
      {
        code: 'ru',
        file: 'ru-RU.json',
        iso: 'ru-RU'
      },
      {
        code: 'en',
        file: 'en-US.json',
        iso: 'en-US'
      }
    ],
    lazy: true,
    langDir: 'lang',
    defaultLocale: 'ru',
    strategy: 'prefix_except_default'
  },

  css: ['@/assets/styles/main.scss'],
  pinia: {
    autoImports: [
      // automatically imports `defineStore`
      'defineStore', // import { defineStore } from 'pinia'
      ['defineStore', 'definePiniaStore'], // import { defineStore as definePiniaStore } from 'pinia'
    ],
  },
  ssr: false,
  runtimeConfig: {
    public: {
      api: process.env.NUXT_PUBLIC_API || 'https://new-origin.kz/api',
      image: process.env.NUXT_PUBLIC_IMAGE || 'https://new-origin.kz/',
    },
  },

  app: {
    // Для GitHub Pages: NUXT_APP_BASE_URL=/zarozdenie/ (имя репозитория со слэшем)
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'ЗАРОЖДЕНИЕ — суррогатное материнство и донорство',
      titleTemplate: '%s',
      htmlAttrs: {
        lang: 'ru'
      },
      meta: [
        {
          name: 'description',
          content: 'Агентство суррогатного материнства ЗАРОЖДЕНИЕ: подбор суррогатной мамы и доноров ооцитов, юридическое и медицинское сопровождение.'
        }
      ],
      link: [{ rel: 'icon', type: 'image/png', href: `${baseWithSlash}logo.png` }]
    }
  },
})
