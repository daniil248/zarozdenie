<template>
  <div class="page-home page-atmosphere">
    <div class="page-atmosphere__bg" aria-hidden="true">
      <div class="page-atmosphere__orb page-atmosphere__orb--1" />
      <div class="page-atmosphere__orb page-atmosphere__orb--2" />
      <div class="page-atmosphere__orb page-atmosphere__orb--3" />
    </div>
    <BackgroundDots :bright="true" />
    <TheHeader />
    <div class="page-home__content">
    <IndexIntro />
    <IndexAbout />
    <IndexService />
    <div class="block">
      <div class="container">
        <div class="block__toggler">
          <div :class="!statusBlock ? 'active' : ''" @click="changeStatusBlock(false)">{{ $t('Донор') }}</div>
          <div :class="statusBlock ? 'active' : ''" @click="changeStatusBlock(true)">{{ $t('Реципиент') }}</div>
        </div>
        <h2 class="title">{{ $t('Присоединитесь к нам в миссии создания семей') }}</h2>
        <p class="text">{{
          $t('Выберите свой путь: Стать донором или Стать клиентом суррогатного материнства')
        }}</p>
        <div class="block__row">
          <NuxtLink :to="localePath('/auth/form')">{{ $t('Заполнить анкету') }}</NuxtLink>
          <a :href="anchor('contacts')">{{ $t('Связаться с нами') }}</a>
        </div>
      </div>
    </div>
    <IndexCondition :status="statusBlock" />
    <div class="block">
      <div class="container">
        <h2 class="title">{{ $t('Хотите посмотреть доноров?') }}</h2>
        <p class="text">{{
          $t('Просматривайте наших потенциальных доноров и выбирайте идеального кандидата для вашей семьи')
        }}</p>
        <div class="block__row">
          <NuxtLink :to="localePath('/auth')">{{ $t('Зарегистрироваться') }}</NuxtLink>
          <a :href="anchor('contacts')">{{ $t('Связаться с нами') }}</a>
        </div>
      </div>
    </div>
    <IndexContact />
    <TheFooter />
    </div>
  </div>
</template>



<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: t('Главная страница')
})

const localePath = useLocalePath()
const anchor = useLocaleAnchor()
const statusBlock = ref(false)
const changeStatusBlock = (bool: boolean) => {
  statusBlock.value = bool
}
</script>