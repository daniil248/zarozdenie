<template>
  <div class="intro">
    <div class="container">

      <Swiper :modules="[Navigation, Pagination]"
        :navigation="{ nextEl: '.swiper-button-nexts', prevEl: '.swiper-button-prevs', }"
        :pagination="{ clickable: true }" :space-between="60" :slides-per-view="1" :loop="true" :effect="'creative'"
        :autoplay="{
          delay: 8000,
          disableOnInteraction: true,
        }">
        <SwiperSlide>
          <div class="intro__item">
            <img src="@/assets/images/intro1.png" alt="Donor">
            <div class="intro__item-text">
              <h2>{{ $t('Станьте частью чуда') }}</h2>
              <p>{{ $t('Станьте донором и подарите радость родительства другим людям') }}</p>
              <NuxtLink :to="localePath('/auth/form')">{{ $t('Стать донором') }}</NuxtLink>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div class="intro__item">
            <img src="@/assets/images/intro2.png" alt="Donor">
            <div class="intro__item-text">
              <h2>{{ $t('Станьте родителями') }}</h2>
              <p>{{ $t('Мы подберем для вас идеального донора и сопроводим вас на всем пути') }}</p>
              <NuxtLink :to="localePath('/auth')">{{ $t('Стать клиентом') }}</NuxtLink>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div class="intro__item">
            <img src="@/assets/images/intro3.png" alt="Donor">
            <div class="intro__item-text">
              <h2>{{ $t('Дарите и получайте') }}</h2>
              <p>{{ $t('Заполните анкету на сайте и узнайте больше о суррогатном материнстве.') }}</p>
              <NuxtLink :to="localePath('/auth/form')" href="">{{ $t('Заполнить анкету') }}</NuxtLink>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
      <div class="swiper-button-prev swiper-button-prevs"></div>
      <div class="swiper-button-next swiper-button-nexts"></div>
    </div>
  </div>
</template>



<script setup lang="ts">
const localePath = useLocalePath()
import { Swiper, SwiperSlide, useSwiper } from "swiper/vue";
import { Navigation, Pagination } from 'swiper/modules';
// Import Swiper styles
import "swiper/css";
import 'swiper/css/navigation';
import 'swiper/css/pagination';

</script>