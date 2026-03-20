<template>
  <nav aria-label="pagination" class="pagination">
    <ul>
      <li>
        <button type="button" @click="$emit('prev-page')" :disabled="currentPage === 1 ? true : false"
          :aria-label="`Go to the previous page, page ${currentPage - 1}`">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 17L1 9L9 1" stroke="#939392" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </li>
      <li v-for="(page, index) in pagination" :key="index" class="pagination__range"
        :class="currentPage === page ? 'active' : ''">
        <button v-if="typeof page === 'number'" type="button" :disabled="currentPage === page ? true : false"
          :aria-label="getButtonLabel(page)" @click="$emit('change', page)">
          {{ page }}
        </button>
        <span v-else>{{ page }}</span>
      </li>
      <li>
        <button type="button" @click="$emit('next-page')" :disabled="currentPage === totalItems ? true : false"
          :aria-label="`Go to the next page, page ${currentPage + 1}`">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M1 17L9 9L0.999999 1" stroke="#939392" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
      </li>
    </ul>
  </nav>
</template>


<script lang="ts" setup>
import usePaginatedRange from '~/composables/pagination';
const emits = defineEmits(['change', 'next-page', 'prev-page'])
const props = defineProps({
  totalItems: { type: Number, default: 0 },
  currentPage: { type: Number, default: 0 },
  visiblePages: { type: Number, default: 4 }
})
const { pagination } = usePaginatedRange(
  toRef(props, "totalItems"),
  toRef(props, "visiblePages"),
  toRef(props, "currentPage"))

const getButtonLabel = (page: number) => {

  if (page === props.totalItems) {
    return `Go to page ${page}, the last page`;
  } else {
    return `Go to page ${page}`;
  }
}

</script>

<style scoped lang="scss">
.pagination {
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 8px;
  }

}


button[disabled] {
  opacity: 50%;
}
</style>