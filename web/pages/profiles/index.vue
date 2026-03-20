<template>
  <div>
    <TheHeader />
    <ProfileList />
  </div>
</template>



<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: t('Анкеты')
})
definePageMeta({
  status: true
})
</script>