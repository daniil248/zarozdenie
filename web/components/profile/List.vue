<template>
  <div class="profile__list">
    <div class="container">
      <h1 class="title">{{ $t('Анкеты') }}</h1>
      <div class="profile__list-filters" v-if="filters">
        <div v-if="filters.nationality" class="filter-dropdown" :class="statusMenu ? 'active' : ''">
          <div class="filter-active" @click="changeMenu">{{ $t('Национальность') }} <span><svg
                xmlns="http://www.w3.org/2000/svg" width="18" height="10" viewBox="0 0 18 10" fill="none">
                <path d="M1 1L9 9L17 1" stroke="#3D3D3A" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg></span>
          </div>
          <div class="filter-list" :class="statusMenu ? 'active' : ''">
            <div :class="activeFilters.nationality.includes(filter) ? 'active' : ''"
              v-for="(filter, index) of filters.nationality" :key="index" @click="changeFilterNationality(filter)"> {{
                filter }}</div>
          </div>
        </div>

        <div class="filter-input">
          <input
            type="text"
            v-model.trim="activeFilters.search"
            placeholder="Поиск: ID, имя, возраст, национальность, город..."
            @input="filteredProducts"
            maxlength="64"
          >
        </div>
      </div>
      <template v-if="!loader">
        <div class=" profile__list-wrapper">

          <template v-for="   product    of    products   " :key="product.id">
            <div class="profile__list-item" v-if="product.status && locale == 'ru'">
              <div class="profile__list-item-block">
                <img :src="`${useRuntimeConfig().public.image + 'uploads/' + product.images[0]}`" alt="ank">
              </div>

              <div class="profile__list-item-block">
                <span>ID: {{ product.id }}</span>
                <span>{{ $t('Год рождения') }}: {{ product.age }}</span>
                <span>{{ $t('Национальность') }}: {{ product.nationality ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Рост') }}: {{ product.height }} см</span>
                <span>{{ $t('Вес') }}: {{ product.weight }} кг</span>
                <span>{{ $t('Цвет глаз') }}: {{ product.eye_color ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Гонорар') }}: {{ product.ganorar ?? $t('Неизвестно') }}</span>
              </div>

              <div class="profile__list-item-block">
                <span>{{ $t('Вредные привычки') }}: {{ product.habits ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Город') }}: {{ product.city ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Аллергии') }}: {{ product.allergies ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Заболевания') }}: {{ product.chronic_diseases ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Профессия') }}: {{ product.profession ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Религия') }}: {{ product.religion ?? $t('Неизвестно') }}</span>
              </div>

              <div class="profile__list-item-block" v-if="product.id">
                <button class="request" @click="sendRequest(product.id)">{{ $t('Оставить заявку') }}</button>
                <NuxtLink :to="localePath(`/profiles/${product.id}`)" class="more">{{ $t('Подробнее') }}</NuxtLink>
              </div>

            </div>

            <div class="profile__list-item" v-if="product.status && locale === 'en'">
              <div class="profile__list-item-block">
                <img :src="`${useRuntimeConfig().public.image + 'uploads/' + product.images[0]}`" alt="ank">
              </div>

              <div class="profile__list-item-block">
                <span>ID: {{ product.id }}</span>
                <span>{{ $t('Год рождения') }}: {{ product.age }}</span>
                <span>{{ $t('Национальность') }}: {{ product.nationality_en ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Рост') }}: {{ product.height }} cm</span>
                <span>{{ $t('Вес') }}: {{ product.weight }} kg</span>
                <span>{{ $t('Цвет глаз') }}: {{ product.eye_color_en ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Гонорар') }}: {{ product.ganorar ?? $t('Неизвестно') }}</span>
              </div>

              <div class="profile__list-item-block">
                <span>{{ $t('Вредные привычки') }}: {{ product.habits_en ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Город') }}: {{ product.city_en ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Аллергии') }}: {{ product.allergies_en ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Заболевания') }}: {{ product.chronic_diseases_en ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Профессия') }}: {{ product.profession_en ?? $t('Неизвестно') }}</span>
                <span>{{ $t('Религия') }}: {{ product.religion_en ?? $t('Неизвестно') }}</span>
              </div>

              <div class="profile__list-item-block" v-if="product.id">
                <button class="request" @click="sendRequest(product.id)"> {{ $t('Оставить заявку') }}</button>
                <NuxtLink NuxtLink :to="localePath(`/profiles/${product.id}`)" class="more">{{ $t('Подробнее') }}
                </NuxtLink>
              </div>

            </div>

          </template>

        </div>

        <div class="profile__list-pagination">
          <ThePagination :total-items="pagination?.lastPage" v-if="pagination.total > 5"
            :current-page="pagination?.currentPage" @next-page="nextPage" @prev-page="prevPage" @change="changePage" />
        </div>
      </template>

      <span class="loader" v-if="loader"></span>
    </div>
  </div>
</template>



<script setup lang="ts">
import { useProductStore } from '~/store/product';
import { useOrderStore } from '~/store/order';
const { locale, } = useI18n()
const localePath = useLocalePath()
const loader = ref(false)
const orderStore = useOrderStore()
const activeFilters = ref({
  nationality: [] as string[],
  age: undefined,
  id: undefined,
  search: ''
})
const statusMenu = ref(false)
const changeMenu = () => {
  statusMenu.value = !statusMenu.value
}

const productsStore = useProductStore()

await productsStore.getAll()
await productsStore.getAllFilters()

const products = computed(() => {
  return productsStore.getProducts
})

const filters = computed(() => {
  return productsStore.getFilters
})

const pagination = computed(() => {
  return productsStore.getPagination
})

const nextPage = async () => {
  loader.value = true
  await productsStore.getAll(typeof pagination?.value?.currentPage != 'undefined' ? pagination.value.currentPage + 1 : undefined)
  loader.value = false
}

const prevPage = async () => {
  loader.value = true
  await productsStore.getAll(typeof pagination?.value?.currentPage != 'undefined' ? pagination.value.currentPage - 1 : undefined)
  loader.value = false
}

const changePage = async (page: number) => {
  loader.value = true
  await productsStore.getAll(page)
  loader.value = false
}

const changeFilterNationality = async (filter: string) => {
  const index = activeFilters.value.nationality.indexOf(filter);

  if (index !== -1) {
    // Строка найдена, удаляем ее
    activeFilters.value.nationality.splice(index, 1);
  } else {
    // Строка не найдена, добавляем ее
    activeFilters.value.nationality.push(filter);
  }
  await filteredProducts()
}
const timer = ref()
const filteredProducts = async () => {
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = setTimeout(async () => {
      await productsStore.getAll(pagination.value?.currentPage, {
        nationality: activeFilters.value.nationality.join(','),
        age: activeFilters.value.age ? activeFilters.value.age : undefined,
        id: activeFilters.value.id,
        search: activeFilters.value.search || undefined
      })
      loader.value = false
    }, 1000);
    loader.value = true
    return
  }
  loader.value = true
  timer.value = setTimeout(async () => {
    await productsStore.getAll(1, {
      nationality: activeFilters.value.nationality.join(','),
      age: activeFilters.value.age ? activeFilters.value.age : undefined,
      id: activeFilters.value.id,
      search: activeFilters.value.search || undefined
    })
    loader.value = false
  }, 1000);

}

const sendRequest = async (productId: number) => {
  await orderStore.create(productId)
}
</script>