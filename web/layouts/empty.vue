<template>
  <div>
    <NuxtPage />
    <div class="">
      <TransitionGroup name="alert">
        <div key="alerts" class="alert" :class="alertStore.getAlert.error ? 'error' : ''" role="alert"
          v-if="alertStore.getAlert.text">
          {{ alertStore.getAlert.text }}
        </div>
      </TransitionGroup>
      <div class=" h-full">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>



<script setup>
import "@/assets/styles/main.scss";

import { useAlertStore } from '@/store/alert';
const alertStore = useAlertStore()
</script>