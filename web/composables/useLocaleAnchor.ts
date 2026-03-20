/**
 * Якоря на главной с учётом префикса локали (/en#…, /zh#…, /#…).
 */
export function useLocaleAnchor () {
  const localePath = useLocalePath()

  return (fragment: string) => {
    const id = fragment.replace(/^#/, '')
    const base = localePath('/')
    const normalized = !base || base === '/' ? '' : String(base).replace(/\/$/, '')
    return normalized ? `${normalized}#${id}` : `/#${id}`
  }
}
