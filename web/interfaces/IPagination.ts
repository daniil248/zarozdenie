export interface IPagination {
  total: number,
  currentPage: number,
  prev: number | null,
  next: number | null,
  lastPage: number
}