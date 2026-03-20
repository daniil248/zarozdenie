<template>
  <div class="form form--atmosphere page-atmosphere">
    <div class="page-atmosphere__bg" aria-hidden="true">
      <div class="page-atmosphere__orb page-atmosphere__orb--1" />
      <div class="page-atmosphere__orb page-atmosphere__orb--2" />
      <div class="page-atmosphere__orb page-atmosphere__orb--3" />
    </div>
    <BackgroundDots />
    <div class="form__content">
    <div class="container">
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
          <h2>{{ $t('Анкета для заполнения') }}</h2>
          <p>{{ $t('Я подтверждаю, что информация в этом приложении является точной и достоверной.') }}</p>
        </div>

        <FormKit type="form" #default="{ value }" :actions="false" @submit="submitHandler">
          <h2 class="title">{{ $t('Личные данные') }}</h2>
          <div class="formkit-wrapper-flex row">
            <FormKit type="text" name="name" validation="required|length:0,120" :label="$t('ФИО')"
              :placeholder="$t('ФИО')" :validation-messages="{
                length: $t('ФИО') + $t('не может быть больше 120 символов'),
                required: $t('ФИО') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="number" validation="required|length:16,16" :label="$t('Номер телефона')"
              :placeholder="$t('Номер телефона')" v-maska data-maska="+#-###-###-##-##" :validation-messages="{
                length: $t('Номер телефона') + $t('должен быть в 16 символов'),
                required: $t('Номер телефона') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="country" validation="required|length:0,120" :label="$t('Страна')"
              :placeholder="$t('Страна')" :validation-messages="{
                length: $t('Страна') + $t('не может быть больше 120 символов'),
                required: $t('Страна') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="city" validation="required|length:0,120" :label="$t('Город')"
              :placeholder="$t('Город')" :validation-messages="{
                length: $t('Город') + $t('не может быть больше 120 символов'),
                required: $t('Город') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="email" validation="required|length:0,120|email" :label="$t('Электронная почта')"
              :placeholder="$t('Электронная почта')" :validation-messages="{
                length: $t('Электронная почта') + $t('не может быть больше 120 символов'),
                required: $t('Электронная почта') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="age" validation="required|number" :label="$t('Год рождения')" number
              :placeholder="$t('Год рождения')" :validation-messages="{
                length: $t('Год рождения') + $t('не может быть больше 120 символов'),
                required: $t('Год рождения') + ' ' + $t('обязательно'),
                number: $t('Год рождения') + ' ' + $t('должен быть цифрой.')
              }" />
            <FormKit type="text" name="nationality" validation="required|length:0,120" :label="$t('Национальность')"
              :placeholder="$t('Национальность')" :validation-messages="{
                length: $t('Национальность') + $t('не может быть больше 120 символов'),
                required: $t('Национальность') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="height" validation="required|number" :label="$t('Рост')" number
              :placeholder="$t('Рост')" :validation-messages="{
                length: $t('Рост') + $t('не может быть больше 120 символов'),
                required: $t('Рост') + ' ' + $t('обязательно'),
                number: $t('Рост') + ' ' + $t('должен быть цифрой.')
              }" />
            <FormKit type="text" name="weight" validation="required|number" :label="$t('Вес')" number
              :placeholder="$t('Вес')" :validation-messages="{
                length: $t('Вес') + $t('не может быть больше 120 символов'),
                required: $t('Вес') + ' ' + $t('обязательно'),
                number: $t('Вес') + ' ' + $t('должен быть цифрой.')
              }" />
            <FormKit type="text" name="eye_color" validation="required|length:0,120" :label="$t('Цвет глаз')"
              :placeholder="$t('Цвет глаз')" :validation-messages="{
                length: $t('Цвет глаз') + $t('не может быть больше 120 символов'),
                required: $t('Цвет глаз') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="hair_color" validation="required|length:0,120" :label="$t('Цвет волос')"
              :placeholder="$t('Цвет волос')" :validation-messages="{
                length: $t('Цвет волос') + $t('не может быть больше 120 символов'),
                required: $t('Цвет волос') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="habits" validation="required|length:0,120" :label="$t('Вредные привычки')"
              :placeholder="$t('Вредные привычки')" :validation-messages="{
                length: $t('Вредные привычки') + $t('не может быть больше 120 символов'),
                required: $t('Вредные привычки') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="allergies" validation="required|length:0,120" :label="$t('Аллергии')"
              :placeholder="$t('Аллергии')" :validation-messages="{
                length: $t('Аллергии') + $t('не может быть больше 120 символов'),
                required: $t('Аллергии') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="chronic_diseases" validation="required|length:0,120" :label="$t('Заболевания')"
              :placeholder="$t('Заболевания')" :validation-messages="{
                length: $t('Заболевания') + $t('не может быть больше 120 символов'),
                required: $t('Заболевания') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="profession" validation="required|length:0,120" :label="$t('Профессия')"
              :placeholder="$t('Профессия')" :validation-messages="{
                length: $t('Профессия') + $t('не может быть больше 120 символов'),
                required: $t('Профессия') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="religion" validation="required|length:0,120" :label="$t('Религия')"
              :placeholder="$t('Религия')" :validation-messages="{
                length: $t('Религия') + $t('не может быть больше 120 символов'),
                required: $t('Религия') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="childrens" validation="required|length:0,120" :label="$t('Кол-во детей')"
              :placeholder="$t('Кол-во детей')" :validation-messages="{
                length: $t('Кол-во детей') + $t('не может быть больше 120 символов'),
                required: $t('Кол-во детей') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="resus" validation="required|length:0,120" :label="$t('Резус фактор')"
              :placeholder="$t('Резус фактор')" :validation-messages="{
                length: $t('Резус фактор') + $t('не может быть больше 120 символов'),
                required: $t('Резус фактор') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="blood_type" validation="required|length:0,120" :label="$t('Группа крови')"
              :placeholder="$t('Группа крови')" :validation-messages="{
                length: $t('Группа крови') + $t('не может быть больше 120 символов'),
                required: $t('Группа крови') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="ganorar" validation="required|length:0,120" :label="$t('Гонорар')"
              :placeholder="$t('Гонорар')" :validation-messages="{
                length: $t('Гонорар') + $t('не может быть больше 120 символов'),
                required: $t('Гонорар') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="education" validation="required|length:0,120" :label="$t('Образование')"
              :placeholder="$t('Образование')" :validation-messages="{
                length: $t('Образование') + $t('не может быть больше 120 символов'),
                required: $t('Образование') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="has_twins" :label="$t('У вас в семье были близнецы')"
              :placeholder="$t('У вас в семье были близнецы')" validation="required|length:0,120" :validation-messages="{
                length: $t('У вас в семье были близнецы') + $t('не может быть больше 120 символов'),
                required: $t('У вас в семье были близнецы') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="menstrual_cycle" :label="$t('У вас регулярный менструальный цикл')"
              :placeholder="$t('У вас регулярный менструальный цикл')" validation="required|length:0,120"
              :validation-messages="{
                length: $t('У вас регулярный менструальный цикл') + $t('не может быть больше 120 символов'),
                required: $t('У вас регулярный менструальный цикл') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="pregnancy_outcome" validation="required|length:0,120" :label="$t('Была беременна')"
              :placeholder="$t('Была беременна')" :validation-messages="{
                length: $t('Была беременна') + $t('не может быть больше 120 символов'),
                required: $t('Была беременна') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="contraceptive_use" validation="required|length:0,120"
              :label="$t('Не принимает противозачаточные средства')"
              :placeholder="$t('Не принимает противозачаточные средства')" :validation-messages="{
                length: $t('Не принимает противозачаточные средства') + $t('не может быть больше 120 символов'),
                required: $t('Не принимает противозачаточные средства') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="health_problems" validation="required|length:0,120"
              :label="$t('Проблемы со здоровьем')" :placeholder="$t('Проблемы со здоровьем')" :validation-messages="{
                length: $t('Проблемы со здоровьем') + $t('не может быть больше 120 символов'),
                required: $t('Проблемы со здоровьем') + ' ' + $t('обязательно')
              }" />
            <FormKit type="text" name="family_medical_history" validation="required|length:0,120"
              :label="$t('Генетические заболевания в семье')" :placeholder="$t('Генетические заболевания в семье')"
              :validation-messages="{
                length: $t('Генетические заболевания в семье') + $t('не может быть больше 120 символов'),
                required: $t('Генетические заболевания в семье') + ' ' + $t('обязательно')
              }" />
            <FormKit type="file" name="images" :label="$t('Изображения')" validation="required|length:0,120"
              accept=".png,.jpg,.JPEG,jpg" multiple="true" :validation-messages="{
                length: $t('Изображения') + $t('не может быть больше 120 символов'),
                required: $t('Изображения') + ' ' + $t('обязательно')
              }" />
          </div>
          <div class="formkit-wrapper-flex row">
            <FormKit type="textarea" name="reproductive_history" validation="required|length:0,500"
              :label="$t('Репродуктивная история')" :placeholder="$t('Репродуктивная история')" :validation-messages="{
                length: $t('Репродуктивная история') + $t('не может быть больше 500 символов'),
                required: $t('Репродуктивная история') + ' ' + $t('обязательно')
              }" />
            <FormKit type="textarea" name="additional_info" validation="required|length:0,500"
              :label="$t('Дополнительная информация')" :placeholder="$t('Дополнительная информация')"
              :validation-messages="{
                length: $t('Дополнительная информация') + $t('не может быть больше 500 символов'),
                required: $t('Дополнительная информация') + ' ' + $t('обязательно')
              }" />
            <FormKit type="textarea" name="genetic_history" validation="required|length:0,500"
              :label="$t('Семья/Генетическая история')" :placeholder="$t('Семья/Генетическая история')"
              :help="$t('Пожалуйста, опишите как можно подробнее')" :validation-messages="{
                length: $t('Семья/Генетическая история') + $t('не может быть больше 500 символов'),
                required: $t('Семья/Генетическая история') + ' ' + $t('обязательно')
              }" />
          </div>

          <FormKit type="submit" :label="$t('Далее')" v-if="!block" />
        </FormKit>

      </div>
    </div>
    </div>
  </div>
</template>



<script setup lang="ts">
import { useProductStore } from '~/store/product';
const i18n = useI18n();
const productStore = useProductStore()
const block = ref(false)
const submitHandler = async (e: Object) => {
  block.value = true
  setTimeout(() => {
    block.value = false
  }, 3000)
  await productStore.create(e as IProduct)
}

</script>