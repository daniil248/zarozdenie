import type { IOrder } from "~/interfaces/IOrder";


export const useOrderStore = defineStore('orders', {
  state: (): { orders: IOrder[] | undefined } => ({
    orders: undefined
  }),
  actions: {
    async create(product_id: number) {
      const order = await useApi().fetch('POST', `/order`, {
        body: {
          product_id
        }
      })

      if (order) {
        useAlert(order.message)
      }
    },

    async getAll() {
      const orders = await useApi().fetch('GET', `/order`, {
      })

      if (orders) {
        this.orders = orders
      }
    },

    async remove(orderId: number) {
      const order = await useApi().fetch('DELETE', `/order/${orderId}`, {
      })

      if (order) {
        useAlert(order.message)
        this.orders = this.orders?.filter(item => item.id != orderId)
      }
    }

  },
  getters: {
    getOrders({ orders }) {
      return orders
    }
  }
});