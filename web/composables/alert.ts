import { useAlertStore } from '@/store/alert.js';
export const useAlert = (text: string, err = false) => {
  useAlertStore().init(text, err);
};