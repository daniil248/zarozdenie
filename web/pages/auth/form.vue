<template>
  <div>
    <AuthForm />
  </div>
</template>



<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: t('Личные данные')
})
</script>