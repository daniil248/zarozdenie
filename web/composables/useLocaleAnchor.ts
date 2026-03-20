/**
 * Якоря на главной (id блока на index), не отдельные маршруты Vue.
 * Формат: /zarozdenie/#aboutUs или /en/#aboutUs — со слэшем перед # для GitHub Pages.
 */
export function useLocaleAnchor () {
  const localePath = useLocalePath()

  return (fragment: string) => {
    const id = fragment.replace(/^#/, '')
    const base = localePath('/')
    const path =
      !base || base === '/'
        ? '/'
        : (base.endsWith('/') ? base : `${base}/`)
    return `${path}#${id}`
  }
}
