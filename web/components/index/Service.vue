<template>
  <div class="service" id="services">
    <div class="container">
      <div class="service__top">
        <h2 class="title">{{ $t(`Наши услуги`) }}</h2>
        <p class="text">{{ $t(`serviceText`) }}</p>
      </div>
      <div class="service__wrapper">
        <NuxtLink :to="localePath('/auth/form')" class="service__item">
          <h3>{{ $t(`Стать донором`) }}</h3>
          <p>{{ $t(`Станьте донором и подарите радость родительства другим людям`) }}</p>
          <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
              <circle cx="40.0003" cy="40" r="28" transform="rotate(-45 40.0003 40)" fill="#A858EC" />
              <path d="M31.986 48.0139L47.5424 32.4575M47.5424 32.4575L47.3656 43.948M47.5424 32.4575L36.0519 32.6343"
                stroke="#FDFDFD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg></span>
        </NuxtLink>

        <NuxtLink :to="localePath('/auth')" class="service__item">
          <h3>{{ $t(`Стать клиентом`) }}</h3>
          <p>{{ $t(`Мы подберем для вас идеального донора и сопроводим вас на всем пути`) }}</p>
          <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
              <circle cx="40.0003" cy="40" r="28" transform="rotate(-45 40.0003 40)" fill="#A858EC" />
              <path d="M31.986 48.0139L47.5424 32.4575M47.5424 32.4575L47.3656 43.948M47.5424 32.4575L36.0519 32.6343"
                stroke="#FDFDFD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg></span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
</script>