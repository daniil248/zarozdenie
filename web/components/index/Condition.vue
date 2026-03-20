<template>
  <div class="condition" id="conditions">
    <div class="condition__top">
      <h2 class="title">{{ status ? $t(`Условия чтобы стать реципиентом`) : $t(`Условия чтобы стать донором`) }}</h2>
      <p class="text">{{ $t(`condition1`) }}</p>
    </div>
    <div class="container">
      <div class="condition__wrapper">
        <div class="condition__item">
          <h3>{{ $t(`Возраст`) }}</h3>
          <p>{{ status ? $t(`condition2_rec`) : $t(`condition2`) }}</p>
        </div>
        <div class="condition__item">
          <h3>{{ $t(`Здоровье`) }}</h3>
          <div>
            <p>{{ status ? $t(`condition3_rec`) : $t(`condition3`) }}</p>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdCqingV029sRrCr5-GRFYn8nMC0qs12kR1zdIqYFSP3Fim2A/viewform?usp=sf_link"
              target="_blank">{{ $t(`Пройти психологический тест`) }}<svg xmlns="http://www.w3.org/2000/svg" width="25"
                height="16" viewBox="0 0 25 16" fill="none">
                <path
                  d="M24.7071 8.7071C25.0976 8.31658 25.0976 7.68342 24.7071 7.29289L18.3431 0.928931C17.9526 0.538406 17.3195 0.538406 16.9289 0.928931C16.5384 1.31946 16.5384 1.95262 16.9289 2.34314L22.5858 8L16.9289 13.6569C16.5384 14.0474 16.5384 14.6805 16.9289 15.0711C17.3195 15.4616 17.9526 15.4616 18.3431 15.0711L24.7071 8.7071ZM8.74228e-08 9L24 9L24 7L-8.74228e-08 7L8.74228e-08 9Z"
                  fill="#939392" />
              </svg></a>
          </div>
        </div>
        <div class="condition__item">
          <h3>{{ $t(`История`) }}</h3>
          <p>{{ status ? $t(`condition4_rec`) : $t('condition4') }}</p>
        </div>
        <div class="condition__item">
          <h3>{{ $t(`Вес и ИМТ`) }}</h3>
          <p>{{ status ? $t(`condition5_rec`) : $t(`condition5`) }}</p>
        </div>
        <div class="condition__item">
          <h3>{{ status ? $t(`Характер`) : $t('Внешность') }}</h3>
          <p>{{ status ? $t(`condition6_rec`) : $t(`condition6`) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
const props = defineProps({
  status: { type: Boolean, default: false }
})
</script>