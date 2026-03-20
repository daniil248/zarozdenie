export interface IOrder {
  id: number,
  product_id: number
  user_id: number,
  product?: {
    name: string,
    id: number
  },
  user?: {
    name: string,
    number: string
  }
}