import type { IFilters } from "~/interfaces/IFilters";
import type { IPagination } from "~/interfaces/IPagination";

export const useProductStore = defineStore('product', {
  state: (): { products: IProduct[], product: IProduct | undefined, pagination: IPagination | undefined, filters: IFilters | undefined } => ({
    products: [],
    product: undefined,
    pagination: undefined,
    filters: undefined
  }),
  actions: {
    async create(data: IProduct) {
      let formData = new FormData();
      data.images.forEach(element => {
        if (typeof element != "string") {
          formData.append('images[]', element.file)
        }
      });

      for (const item in data) {
        if (item != 'images') {
          formData.append(item, data[item])
        }
      }

      const productData = await useApi().fetch('POST', '/product', {
        body: formData
      });

      if (productData) {
        useAlert(productData.message)
        return useRedirect('/')
      }
    },

    async getAll(page?: number, filters?: IFilters) {


      const products = await useApi().fetch('GET', '/product', {
        params: {
          page,
          ...filters
        }
      });

      if (products) {
        this.products = products.data
        this.pagination = products.meta
      }
    },

    async getAllAdmin(page?: number) {
      const products = await useApi().fetch('GET', '/product/admin/product', {
        params: {
          page
        }
      });

      if (products) {
        this.products = products.data
        this.pagination = products.meta
      }
    },

    async getOne(id: string) {
      const productData = await useApi().fetch('GET', `/product/${id}`, {});
      this.product = productData
    },

    async remove(id: number) {
      const product = await useApi().fetch('DELETE', `/product/${id}`, {});
      if (product) {
        this.products?.forEach((element, index) => {
          if (element.id == product.id) {
            this.products.splice(index, 1)
          }
        })
      }
    },

    async changeStatus(id: number) {
      const product = await useApi().fetch('PATCH', `/product/status/${id}`, {});
      if (product) {
        this.products?.forEach((element, index) => {
          if (element.id == product.id) {
            this.products[index] = product
          }
        })
      }
    },

    async update(data: IProduct, productId: number) {
      let formData = new FormData();
      data.images.forEach(element => {
        if (typeof element != "string") {
          formData.append('images[]', element.file)
        }
      });

      for (const item in data) {
        if (item != 'images') {
          formData.append(item, data[item])
        }
      }

      const productData = await useApi().fetch('PATCH', `/product/${productId}`, {
        body: formData
      });

      if (productData) {
        useAlert(productData.message)
        return useRedirect('/admin')
      }
    },

    async getAllFilters() {
      const filtersData = await useApi().fetch('GET', `/product/filters/get`, {})

      if (filtersData) {
        this.filters = filtersData
      }
    }

  },
  getters: {
    getProducts({ products }) {
      return products
    },
    getProduct({ product }) {
      return product
    },
    getPagination({ pagination }) {
      return pagination
    },
    getFilters({ filters }) {
      return filters
    }
  }
});