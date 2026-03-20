<template>
  <div class="header">
    <div class="container">

      <div class="header__wrapper" :class="{ 'header__wrapper--nav-open': mobileMenuOpen }">
        <div class="header__logo">
          <NuxtLink :to="localePath('/')" class="the-logo the-logo--light" @click="closeMobileMenu">
            <img
              class="the-logo__img"
              src="/logo-header-white.svg"
              width="400"
              height="92"
              alt="Зарождение"
              fetchpriority="high"
            />
          </NuxtLink>
        </div>

        <div class="header__nav">
          <p>{{ $t('Меню') }}</p>
          <a :href="anchor('aboutUs')">{{ $t('О нас') }}</a>
          <a :href="anchor('services')">{{ $t('Услуги') }}</a>
          <a :href="anchor('conditions')">{{ $t('Наши ценности') }}</a>
          <a :href="anchor('contacts')">{{ $t('Контакты') }}</a>
        </div>

        <nav class="header__lang" aria-label="Язык">
          <div class="header__lang-segments">
            <NuxtLink
              :to="switchLocalePath('ru')"
              class="header__lang-seg"
              :class="{ 'is-active': locale === 'ru' }"
              @click="closeMobileMenu"
            >
              RU
            </NuxtLink>
            <NuxtLink
              :to="switchLocalePath('en')"
              class="header__lang-seg"
              :class="{ 'is-active': locale === 'en' }"
              @click="closeMobileMenu"
            >
              EN
            </NuxtLink>
          </div>
        </nav>

        <NuxtLink :to="localePath('/auth/form')" class="header__button" @click="closeMobileMenu">
          {{ $t('Заполнить анкету') }}
        </NuxtLink>

        <button
          type="button"
          class="header__burger"
          :aria-expanded="mobileMenuOpen"
          :aria-label="$t('Меню')"
          @click="toggleMobileMenu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

    </div>

    <!-- Вне .container — на всю ширину экрана -->
    <div
      v-show="mobileMenuOpen"
      class="header__mobile-panel"
      role="navigation"
      :aria-label="$t('Меню')"
    >
      <div class="container header__mobile-panel-inner">
        <a :href="anchor('aboutUs')" class="header__mobile-link" @click="closeMobileMenu">{{ $t('О нас') }}</a>
        <a :href="anchor('services')" class="header__mobile-link" @click="closeMobileMenu">{{ $t('Услуги') }}</a>
        <a :href="anchor('conditions')" class="header__mobile-link" @click="closeMobileMenu">{{ $t('Наши ценности') }}</a>
        <a :href="anchor('contacts')" class="header__mobile-link" @click="closeMobileMenu">{{ $t('Контакты') }}</a>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const anchor = useLocaleAnchor()

const mobileMenuOpen = ref(false)

function toggleMobileMenu () {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobileMenu () {
  mobileMenuOpen.value = false
}

watch(() => route.fullPath, () => {
  closeMobileMenu()
})

function onResizeCloseMenu () {
  if (typeof window !== 'undefined' && window.innerWidth > 960) {
    closeMobileMenu()
  }
}

onMounted(() => {
  window.addEventListener('resize', onResizeCloseMenu)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResizeCloseMenu)
})
</script>
