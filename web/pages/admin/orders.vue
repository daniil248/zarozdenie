<template>
  <div class="access">
    <div class="container">
      <div to="/" class="admin__top_link">
        <TheLogo />
      </div>
      <h1 class="title">Заявки</h1>
      <AdminMenu>
        <template #filters>

        </template>
      </AdminMenu>

      <div class="access__wrapper">
        <div class="access__top">
          <h3>Имя</h3>
          <h3>Номер</h3>
          <h3>Id анкеты</h3>
        </div>


        <template v-for="order of orders" :key="order.id">
          <div class="access__item" v-if="order.user && order.product">
            <div class="access__item-left">
              <p><span>Имя</span>{{ order.user.name }}</p>
              <p><span>Номер</span>{{ order.user.number }}</p>
              <p><span>Id анкеты</span>
                <NuxtLink target="_blank" :to="`/profiles/${order.product_id}`"><span>{{ order.product.id }}</span>Перейти
                  на анкету</NuxtLink>
              </p>
            </div>
            <div class="access__item-right">
              <button class="reject" @click="removeOrder(order.id)">
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
import { useOrderStore } from '~/store/order';


definePageMeta({
  admin: true
})

const orderStore = useOrderStore()
await orderStore.getAll()

const orders = computed(() => {
  return orderStore.getOrders
})


const removeOrder = async (orderId: number) => {
  const res = confirm('Вы уверены, что хотите удалить заявку?')
  if (!res) {
    return
  }
  await orderStore.remove(orderId)
}
</script>