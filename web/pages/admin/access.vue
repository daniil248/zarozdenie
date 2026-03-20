<template>
  <div class="access">
    <div class="container">
      <div to="/" class="admin__top_link">
        <TheLogo />
      </div>
      <h1 class="title">Доступ</h1>
      <AdminMenu>
        <template #filters>
          <div class="access__filters">
            <input type="text" placeholder="Поиск по номеру / имени" @keyup="onFilter" v-model="filter">
          </div>
        </template>
      </AdminMenu>

      <div class="access__wrapper">
        <div class="access__top">
          <h3>Имя</h3>
          <h3>Номер</h3>
          <h3>Статус</h3>
        </div>


        <template v-for="user of users" :key="user.id">
          <div class="access__item">
            <div class="access__item-left">
              <p><span>Имя</span>{{ user.name }}</p>
              <p><span>Номер</span>{{ user.number }}</p>
              <p><span>Статус</span>{{ user.status ? 'Разрешено' : 'Запрещено' }}</p>
            </div>
            <div class="access__item-right">
              <button class="accept" @click="userStatusChange(user.id)" v-if="!user.status">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="26" viewBox="0 0 36 26" fill="none">
                  <path d="M33 3L13 23L3 13" stroke="#FFFAF5" stroke-width="6" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
              <button class="reject" @click="userStatusChange(user.id)" v-else>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path d="M3 3L27 27M3 27L27 3" stroke="#FDFDFD" stroke-width="6" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>



<script setup lang="ts">
import { useUserStore } from '~/store/user';
definePageMeta({
  admin: true
})

const userStore = useUserStore()
await userStore.getAll()
const users = computed(() => {
  return userStore.getUsers
})

const userStatusChange = async (userId: number) => {
  await userStore.changeStatus(userId)
  await userStore.getAll()
}
const filter = ref('')
const onFilter = () => {
  userStore.setFilter(filter.value)
}
</script>