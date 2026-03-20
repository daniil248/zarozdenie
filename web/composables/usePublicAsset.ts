/**
 * Файлы из public/ с учётом app.baseURL (GitHub Pages: /zarozdenie/…).
 */
export function usePublicAsset () {
  return (path: string) => {
    const base = import.meta.env.BASE_URL || '/'
    const p = path.replace(/^\//, '')
    return base.endsWith('/') ? `${base}${p}` : `${base}/${p}`
  }
}
