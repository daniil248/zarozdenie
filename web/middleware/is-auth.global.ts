import { useUserStore } from "@/store/user";
import { useAlertStore } from "@/store/alert";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.client) {
    const accessToken = useCookie("accessToken");
    const refreshToken = useCookie("refreshToken");
    if (to.meta.admin) {
      if (!accessToken.value || !refreshToken.value) {
        return useRedirect("/auth");
      }
      await useUserStore().refresh();
      if (useUserStore().getUser?.role != 'ADMIN') {
        useAlertStore().init('У вас недостаточно доступа', true)
        return useRedirect("/auth");
      }
    }
    if (to.meta.guard) {
      if (!accessToken.value || !refreshToken.value) {
        return useRedirect("/auth");
      } else {
        await useUserStore().refresh();
      }
    }

    if (to.meta.status) {
      if (!accessToken.value || !refreshToken.value) {
        return useRedirect("/auth");
      } else {
        await useUserStore().refresh();
        if (!useUserStore().getUser?.status) {
          useAlertStore().init('У вас недостаточно доступа', true)
          return useRedirect("/auth");
        }
      }
    }
  }
});