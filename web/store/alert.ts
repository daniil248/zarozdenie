
export const useAlertStore = defineStore({
  id: 'alert',
  state: () => ({
    alert: {
      timer: null,
      text: '',
      error: false,
    }
  }),
  actions: {
    async init(text: string, err = false) {
      if (this.alert.timer) {
        clearTimeout(this.alert.timer);
      }

      this.alert.text = text;
      this.alert.error = err;
      this.alert.timer = setTimeout(() => {
        this.alert.text = '';
      }, 5000) as any;
    },
  },
  getters: {
    getAlert: state => state.alert,
  },
})