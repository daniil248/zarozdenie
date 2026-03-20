<template>
  <div class="formkit-wrapper-flex row">
    <FormKit type="text" name="name" validation="required|length:0,120" label="ФИО" :value="product.name"
      :validation-messages="{
        length: $t('ФИО') + $t('не может быть больше 120 символов'),
        required: $t('ФИО') + ' ' + $t('обязательно')
      }" />
    <FormKit type="text" name="name_en" validation="length:0,120" label="ФИО на английском" :value="product.name_en"
      :validation-messages="{
        length: $t('ФИО') + $t('не может быть больше 120 символов'),
        required: $t('ФИО') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="number" validation="required|length:16,16" label="Номер телефона" :value="product.number"
      v-maska data-maska="+#-###-###-##-##" :validation-messages="{
        length: $t('Номер телефона') + $t('должен быть в 16 символов'),
        required: $t('Номер телефона') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="email" validation="required|length:0,120|email" label="Электронная почта"
      :value="product.email" :placeholder="$t('Электронная почта')" :validation-messages="{
        length: $t('Электронная почта') + $t('не может быть больше 120 символов'),
        required: $t('Электронная почта') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="country" validation="required|length:0,120" label="Страна" :value="product.country"
      :validation-messages="{
        length: $t('Страна') + $t('не может быть больше 120 символов'),
        required: $t('Страна') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="country_en" validation="length:0,120" label="Страна на английском"
      :value="product.country_en" :validation-messages="{
        length: $t('Страна') + $t('не может быть больше 120 символов'),
        required: $t('Страна') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="city" validation="required|length:0,120" label="Город" :value="product.city"
      :validation-messages="{
        length: $t('Город') + $t('не может быть больше 120 символов'),
        required: $t('Город') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="city_en" validation="length:0,120" label="Город на английском" :value="product.city_en"
      :validation-messages="{
        length: $t('Город') + $t('не может быть больше 120 символов'),
        required: $t('Город') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="age" validation="required|number" label="Год рождения" number :value="product.age"
      :placeholder="$t('Год рождения')" :validation-messages="{
        length: $t('Год рождения') + $t('не может быть больше 120 символов'),
        required: $t('Год рождения') + ' ' + $t('обязательно'),
        number: $t('Год рождения') + ' ' + $t('должен быть цифрой.')
      }
        " />

    <FormKit type="text" name="height" validation="required|number" label="Рост" number :value="product.height"
      :placeholder="$t('Рост')" :validation-messages="{
        length: $t('Рост') + $t('не может быть больше 120 символов'),
        required: $t('Рост') + ' ' + $t('обязательно'),
        number: $t('Рост') + ' ' + $t('должен быть цифрой.')
      }
        " />
    <FormKit type="text" name="weight" validation="required|number" label="Вес" number :value="product.weight"
      :placeholder="$t('Вес')" :validation-messages="{
        length: $t('Вес') + $t('не может быть больше 120 символов'),
        required: $t('Вес') + ' ' + $t('обязательно'),
        number: $t('Вес') + ' ' + $t('должен быть цифрой.')
      }
        " />
    <FormKit type="text" name="nationality" validation="required|length:0,120" label="Национальность"
      :value="product.nationality" :validation-messages="{
        length: $t('Национальность') + $t('не может быть больше 120 символов'),
        required: $t('Национальность') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="nationality_en" validation="length:0,120" label="Национальность на английском"
      :value="product.nationality_en" :validation-messages="{
        length: $t('Национальность') + $t('не может быть больше 120 символов'),
        required: $t('Национальность') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="eye_color" validation="required|length:0,120" label="Цвет глаз" :value="product.eye_color"
      :validation-messages="{
        length: $t('Цвет глаз') + $t('не может быть больше 120 символов'),
        required: $t('Цвет глаз') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="eye_color_en" validation="length:0,120" label="Цвет глаз на английском"
      :value="product.eye_color_en" :validation-messages="{
        length: $t('Цвет глаз') + $t('не может быть больше 120 символов'),
        required: $t('Цвет глаз') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="hair_color" validation="required|length:0,120" label="Цвет волос"
      :value="product.hair_color" :validation-messages="{
        length: $t('Цвет волос') + $t('не может быть больше 120 символов'),
        required: $t('Цвет волос') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="hair_color_en" validation="length:0,120" label="Цвет волос на английском"
      :value="product.hair_color_en" :validation-messages="{
        length: $t('Цвет волос') + $t('не может быть больше 120 символов'),
        required: $t('Цвет волос') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="habits" validation="required|length:0,120" label="Вредные привычки" :value="product.habits"
      :validation-messages="{
        length: $t('Вредные привычки') + $t('не может быть больше 120 символов'),
        required: $t('Вредные привычки') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="habits_en" validation="length:0,120" label="Вредные привычки на английском"
      :value="product.habits_en" :validation-messages="{
        length: $t('Вредные привычки') + $t('не может быть больше 120 символов'),
        required: $t('Вредные привычки') + ' ' + $t('обязательно')
      }
        " />

    <FormKit type="text" name="allergies" validation="required|length:0,120" label="Аллергии" :value="product.allergies"
      :validation-messages="{
        length: $t('Аллергии') + $t('не может быть больше 120 символов'),
        required: $t('Аллергии') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="allergies_en" validation="length:0,120" label="Аллергии на английском"
      :value="product.allergies_en" :validation-messages="{
        length: $t('Аллергии') + $t('не может быть больше 120 символов'),
        required: $t('Аллергии') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="chronic_diseases" validation="required|length:0,120" label="Заболевания"
      :value="product.chronic_diseases" :validation-messages="{
        length: $t('Заболевания') + $t('не может быть больше 120 символов'),
        required: $t('Заболевания') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="chronic_diseases_en" validation="length:0,120" label="Заболевания на английском"
      :value="product.chronic_diseases_en" :validation-messages="{
        length: $t('Заболевания') + $t('не может быть больше 120 символов'),
        required: $t('Заболевания') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="profession" validation="required|length:0,120" label="Профессия"
      :value="product.profession" :validation-messages="{
        length: $t('Профессия') + $t('не может быть больше 120 символов'),
        required: $t('Профессия') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="profession_en" validation="length:0,120" label="Профессия на английском"
      :value="product.profession_en" :validation-messages="{
        length: $t('Профессия') + $t('не может быть больше 120 символов'),
        required: $t('Профессия') + ' ' + $t('обязательно')
      }
        " />

    <FormKit type="text" name="resus" validation="required|length:0,120" label="Резус фактор" :value="product.resus"
      :validation-messages="{
        length: $t('Резус фактор') + $t('не может быть больше 120 символов'),
        required: $t('Резус фактор') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="resus_en" validation="length:0,120" label="Резус фактор на английском"
      :value="product.resus_en" :validation-messages="{
        length: $t('Резус фактор') + $t('не может быть больше 120 символов'),
        required: $t('Резус фактор') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="education" validation="required|length:0,120" label="Образование"
      :value="product.education" :validation-messages="{
        length: $t('Образование') + $t('не может быть больше 120 символов'),
        required: $t('Образование') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="education_en" validation="length:0,120" label="Образование на английском"
      :value="product.education_en" :validation-messages="{
        length: $t('Образование') + $t('не может быть больше 120 символов'),
        required: $t('Образование') + ' ' + $t('обязательно')
      }
        " />

    <FormKit type="text" name="blood_type" validation="required|length:0,120" label="Группа крови"
      :value="product.blood_type" :validation-messages="{
        length: $t('Группа крови') + $t('не может быть больше 120 символов'),
        required: $t('Группа крови') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="blood_type_en" validation="length:0,120" label="Группа крови на английском"
      :value="product.blood_type_en" :validation-messages="{
        length: $t('Группа крови') + $t('не может быть больше 120 символов'),
        required: $t('Группа крови') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="childrens" validation="required|length:0,120" label="Кол-во детей"
      :value="product.childrens" :validation-messages="{
        length: $t('Кол-во детей') + $t('не может быть больше 120 символов'),
        required: $t('Кол-во детей') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="childrens_en" validation="length:0,120" label="Кол-во детей на английском"
      :value="product.childrens_en" :validation-messages="{
        length: $t('Кол-во детей') + $t('не может быть больше 120 символов'),
        required: $t('Кол-во детей') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="religion" validation="required|length:0,120" label="Религия" :value="product.religion"
      :validation-messages="{
        length: $t('Религия') + $t('не может быть больше 120 символов'),
        required: $t('Религия') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="religion_en" validation="length:0,120" label="Религия на английском"
      :value="product.religion_en" :validation-messages="{
        length: $t('Религия') + $t('не может быть больше 120 символов'),
        required: $t('Религия') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="has_twins" label="У вас в семье были близнецы" :value="product.has_twins"
      validation="required|length:0,120" :validation-messages="{
        length: $t('У вас в семье были близнецы') + $t('не может быть больше 120 символов'),
        required: $t('У вас в семье были близнецы') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="has_twins_en" label="У вас в семье были близнецы на английском"
      :value="product.has_twins_en" validation="length:0,120" :validation-messages="{
        length: $t('У вас в семье были близнецы') + $t('не может быть больше 120 символов'),
        required: $t('У вас в семье были близнецы') + ' ' + $t('обязательно')
      }
        " />

    <FormKit type="text" name="menstrual_cycle" label="У вас регулярный менструальный цикл"
      :value="product.menstrual_cycle" validation="required|length:0,120" :validation-messages="{
        length: $t('У вас регулярный менструальный цикл') + $t('не может быть больше 120 символов'),
        required: $t('У вас регулярный менструальный цикл') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="menstrual_cycle_en" label="У вас регулярный менструальный цикл на английском"
      :value="product.menstrual_cycle_en" validation="length:0,120" :validation-messages="{
        length: $t('У вас регулярный менструальный цикл') + $t('не может быть больше 120 символов'),
        required: $t('У вас регулярный менструальный цикл') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="pregnancy_outcome" validation="required|length:0,120" label="Была беременна"
      :value="product.pregnancy_outcome" :validation-messages="{
        length: $t('Была беременна') + $t('не может быть больше 120 символов'),
        required: $t('Была беременна') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="pregnancy_outcome_en" validation="length:0,120" label="Была беременна на английском"
      :value="product.pregnancy_outcome_en" :validation-messages="{
        length: $t('Была беременна') + $t('не может быть больше 120 символов'),
        required: $t('Была беременна') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="ganorar" :value="product.ganorar" validation="required|length:0,120" :label="$t('Гонорар')"
      :placeholder="$t('Гонорар')" :validation-messages="{
        length: $t('Гонорар') + $t('не может быть больше 120 символов'),
        required: $t('Гонорар') + ' ' + $t('обязательно')
      }" />
    <FormKit type="text" name="contraceptive_use" validation="required|length:0,120" :value="product.contraceptive_use"
      label="Не принимает противозачаточные средства" :validation-messages="{
        length: $t('Не принимает противозачаточные средства') + $t('не может быть больше 120 символов'),
        required: $t('Не принимает противозачаточные средства') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="contraceptive_use_en" validation="length:0,120" :value="product.contraceptive_use_en"
      label="Не принимает противозачаточные средства на английском" :validation-messages="{
        length: $t('Не принимает противозачаточные средства') + $t('не может быть больше 120 символов'),
        required: $t('Не принимает противозачаточные средства') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="health_problems" validation="required|length:0,120" :value="product.health_problems"
      label="Проблемы со здоровьем" :validation-messages="{
        length: $t('Проблемы со здоровьем') + $t('не может быть больше 120 символов'),
        required: $t('Проблемы со здоровьем') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="health_problems_en" validation="length:0,120" :value="product.health_problems_en"
      label="Проблемы со здоровьем на английском" :validation-messages="{
        length: $t('Проблемы со здоровьем') + $t('не может быть больше 120 символов'),
        required: $t('Проблемы со здоровьем') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="family_medical_history" validation="required|length:0,120"
      :value="product.family_medical_history" label="Генетические заболевания в семье" :validation-messages="{
        length: $t('Генетические заболевания в семье') + $t('не может быть больше 120 символов'),
        required: $t('Генетические заболевания в семье') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="text" name="family_medical_history_en" validation="length:0,120"
      :value="product.family_medical_history_en" label="Генетические заболевания в семье" :validation-messages="{
        length: $t('Генетические заболевания в семье') + $t('не может быть больше 120 символов'),
        required: $t('Генетические заболевания в семье') + ' ' + $t('обязательно')
      }
        " />
  </div>
  <div class="formkit-wrapper-flex row">
    <FormKit type="textarea" name="reproductive_history" validation="required|length:0,500"
      :value="product.reproductive_history" label="Репродуктивная история" :validation-messages="{
        length: $t('Репродуктивная история') + $t('не может быть больше 500 символов'),
        required: $t('Репродуктивная история') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="textarea" name="reproductive_history_en" validation="length:0,500"
      :value="product.reproductive_history_en" label="Репродуктивная история на английском" :validation-messages="{
        length: $t('Репродуктивная история') + $t('не может быть больше 500 символов'),
        required: $t('Репродуктивная история') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="textarea" name="additional_info" validation="required|length:0,500" :value="product.additional_info"
      label="О себе" :validation-messages="{
        length: $t('О себе') + $t('не может быть больше 500 символов'),
        required: $t('О себе') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="textarea" name="additional_info_en" validation="length:0,500" :value="product.additional_info_en"
      label="О себе на английском" :validation-messages="{
        length: $t('О себе') + $t('не может быть больше 500 символов'),
        required: $t('О себе') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="textarea" name="genetic_history" validation="required|length:0,500" :value="product.genetic_history"
      label="Информация о семье" :help="$t('Пожалуйста, опишите как можно подробнее')" :validation-messages="{
        length: $t('Информация о семье') + $t('не может быть больше 500 символов'),
        required: $t('Информация о семье') + ' ' + $t('обязательно')
      }
        " />
    <FormKit type="textarea" name="genetic_history_en" validation="length:0,500" :value="product.genetic_history_en"
      label="Информация о семье на английском" :help="$t('Пожалуйста, опишите как можно подробнее')" :validation-messages="{
        length: $t('Информация о семье') + $t('не может быть больше 500 символов'),
        required: $t('Информация о семье') + ' ' + $t('обязательно')
      }
        " />
  </div>
</template>



<script setup lang="ts">

const props = defineProps({
  product: { type: Object, required: true },
})

</script>
