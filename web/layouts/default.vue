<template>
  <div>
    <NuxtPage />
    <ClientOnly>
      <TransitionGroup name="alert">
        <div key="alertt" class="alert" :class="alertStore.getAlert.error ? 'error' : ''" role="alert"
          v-if="alertStore.getAlert.text">
          {{ alertStore.getAlert.text }}
        </div>
      </TransitionGroup>
    </ClientOnly>
  </div>
</template>



<script setup lang="ts">
import { useAlertStore } from '@/store/alert';

const alertStore = useAlertStore()
</script>