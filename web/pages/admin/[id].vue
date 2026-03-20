<template>
  <div class="form">
    <div class="container" v-if="product">
      <div to="/" class="admin__top_link">
        <TheLogo />
      </div>
      <div class="form__wrapper">
        <div class="form__top">
          <div class="heart">
            <svg xmlns="http://www.w3.org/2000/svg" width="193" height="193" viewBox="0 0 193 193" fill="none">
              <g clip-path="url(#clip0_277_3225)">
                <path
                  d="M188 96.5C188 147.034 147.034 188 96.5 188C45.9659 188 5 147.034 5 96.5C5 45.9659 45.9659 5 96.5 5C147.034 5 188 45.9659 188 96.5Z"
                  fill="#FFFAF5" stroke="#F2E4F9" stroke-width="10" />
                <path
                  d="M153.283 81.1526L153.269 81.4821L153.296 81.7822C153.296 81.7942 153.298 81.8178 153.3 81.8527C153.304 81.9416 153.311 82.1037 153.313 82.3346C153.317 82.7965 153.304 83.5326 153.225 84.508C153.067 86.4586 152.644 89.3639 151.562 92.9483C149.408 100.085 144.602 110.051 133.839 120.616L133.821 120.633L133.804 120.65C124.215 130.247 113.513 139.446 96.3218 153.467C79.1315 139.453 68.4304 130.254 58.8421 120.652L58.8236 120.633L58.805 120.615C48.0325 110.05 43.2229 100.083 41.0668 92.9471C39.9839 89.3628 39.5602 86.4577 39.4019 84.5074C39.3227 83.5321 39.3099 82.796 39.3142 82.3343C39.3164 82.1034 39.3228 81.9414 39.3273 81.8525C39.3291 81.8177 39.3305 81.7941 39.3313 81.7821L39.3658 81.3975L39.3342 80.984C39.3187 80.7799 39.3163 80.5452 39.3163 80.0832C39.3163 65.6019 51.6245 52.9131 66.7867 52.9131C77.7239 52.9131 87.3943 60.009 91.802 69.2537L96.3153 78.7196L100.829 69.2537C105.237 60.0084 114.904 52.9131 125.84 52.9131C141.002 52.9131 153.311 65.6019 153.311 80.0832C153.311 80.4066 153.3 80.7496 153.283 81.1526Z"
                  fill="#A858EC" stroke="#3D3D3A" stroke-width="10" />
              </g>
              <defs>
                <clipPath id="clip0_277_3225">
                  <rect width="193" height="193" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <h2>Редактирование анкеты {{ product.name }}</h2>
          <p>Добавьте перевод для этой анкеты, после чего можно будет добавить ее на сайт <br> Для уточнения подробной
            информации, вот номер оставленный к этой анкете : {{ product.number }}</p>
        </div>

        <FormKit type="form" #default="{ value }" :actions="false" @submit="submitHandler">
          <h2 class="title">Анкета</h2>
          <AdminForm :product="product" />


          <div class="images">
            <h4>Изображения к анкете</h4>
            <div>
              <img :src="`${useRuntimeConfig().public.image + 'uploads/' + image}`" alt=""
                v-for="image of product.images">
            </div>
          </div>

          <FormKit type="file" name="images" label="Изображения" validation="length:0,5"
            help="ВНИМАНИЕ, если выбрать новые изображения, старые заменятся на те, которые выберете"
            accept=".png,.jpg,.JPEG,jpg" multiple="true" :validation-messages="{
              length: $t('Изображения') + $t('не может быть больше 120 символов'),
              required: $t('Изображения') + ' ' + $t('обязательно')
            }" />

          <FormKit type="submit" label="Сохранить" />
        </FormKit>

      </div>
    </div>

  </div>
</template>



<script setup lang="ts">
definePageMeta({
  admin: true
})
import { useProductStore } from '~/store/product';
const i18n = useI18n();
const route = useRoute()
const productStore = useProductStore()
await productStore.getOne(`${route.params.id}`)
const product = computed(() => {
  return productStore.getProduct
})

const submitHandler = async (e: Object) => {
  if (product.value?.id) {
    await productStore.update(e as IProduct, product.value.id)
  }
}

</script>