<template>
  <div>
    <AuthLogin />
  </div>
</template>



<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: t('Авторизация')
})
</script>