<template>
  <div class="admin__menu">

    <div class="admin__menu-component">
      <slot name="filters">

      </slot>
    </div>

    <NuxtLink to="/admin">Анкеты</NuxtLink>
    <NuxtLink to="/admin/access">Модерация</NuxtLink>
    <NuxtLink to="/admin/orders">Заявки</NuxtLink>
  </div>
</template>



<script setup lang="ts">

</script>