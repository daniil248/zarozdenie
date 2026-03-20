export const useRedirect = (path: string) => {
  const locale = localStorage.getItem('lang');


  // Определите базовый путь в зависимости от выбранного языка
  const basePath = locale === 'en' ? '/en' : '';

  // Создайте путь, который включает базовый путь и желаемый путь
  const redirectPath = `${basePath}${path}`;


  // Затем выполните перенаправление на полученный путь
  return navigateTo(redirectPath);
}
