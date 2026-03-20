<template>
  <div class="ankets">
    <div class="container">
      <div to="/" class="admin__top_link">
        <TheLogo />
      </div>
      <h1 class="title">Анкеты</h1>
      <AdminMenu>
        <template #filters>
          <div></div>
        </template>
      </AdminMenu>

      <div class="profile__list-wrapper">

        <template v-for="product of products" :key="product.id">
          <div class="profile__list-item" v-if="product.id">
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

            <div class="profile__list-item-block">
              <button class="accept" @click="changeStatus(product.id)" v-if="!product.status">Разрешить</button>
              <button class="accept" @click="changeStatus(product.id)" v-else>Отключить</button>
              <button class="remove" @click="removeForm(product.id)">Удалить</button>
              <NuxtLink :to="`/admin/${product.id}`" class="more">Редактировать</NuxtLink>
            </div>

          </div>



        </template>

      </div>

      <div class="profile__list-pagination">
        <ThePagination :total-items="pagination?.lastPage" v-if="pagination.total > 5"
          :current-page="pagination?.currentPage" @next-page="nextPage" @prev-page="prevPage" @change="changePage" />
      </div>


    </div>
  </div>
</template>



<script setup lang="ts">
import { useProductStore } from '~/store/product';

definePageMeta({
  admin: true
})

const productsStore = useProductStore()
await productsStore.getAllAdmin()
const products = computed(() => {
  return productsStore.getProducts
})

const removeForm = async (id: number) => {
  const res = confirm('Вы действительно хотите удалить анкету?')
  if (!res) {
    return
  }

  await productsStore.remove(id)

}

const changeStatus = async (id: number) => {
  await productsStore.changeStatus(id)
}


const pagination = computed(() => {
  return productsStore.getPagination
})

const nextPage = async () => {
  await productsStore.getAllAdmin(typeof pagination?.value?.currentPage != 'undefined' ? pagination.value.currentPage + 1 : undefined)
}

const prevPage = async () => {
  await productsStore.getAllAdmin(typeof pagination?.value?.currentPage != 'undefined' ? pagination.value.currentPage - 1 : undefined)
}

const changePage = async (page: number) => {
  await productsStore.getAllAdmin(page)

}

</script>