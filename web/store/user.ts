import type { IUser } from "~/interfaces/IUser";

const DAY = 60 * 60 * 24;
const ACCESS_TOKEN_MAX_AGE = DAY;
const REFRESH_TOKEN_MAX_AGE = DAY * 30;
const REFRESH_TOKEN_MAX_AGE_REMEMBER = DAY * 90;
const LAST_LOGIN_KEY = 'lastLoginNumber';
const LAST_LOGIN_NAME_KEY = 'lastLoginName';
const REMEMBER_FLAG_KEY = 'rememberLogin';

const cookieOptions = (maxAge: number) => ({
  maxAge,
  path: '/',
  sameSite: 'lax' as const,
});

export const useUserStore = defineStore('user', {
  state: (): { filter: string, user: IUser | undefined, users: Pick<IUser, 'name' | 'number' | 'id' | 'status'>[] } => ({
    user: undefined,
    users: [],
    filter: ''
  }),
  actions: {
    async exist(number: string, password: string, name: string, remember = true) {

      const data = await useApi().fetch('POST', '/user/exist', { body: { number } })
      if (data.exist) {
        return await this.login(number, password, remember, name)
      }
      await this.registration(number, password, name, remember)
    },
    async registration(number: string, password: string, name: string, remember = true) {
      const registration = await useApi().fetch('POST', '/user/registration', {
        body: {
          number, password, name
        },
      });
      if (registration.user) {
        this.user = registration.user
      }
      if (registration?.accessToken && registration?.refreshToken) {
        this.saveTokens({
          refreshToken: registration.refreshToken,
          accessToken: registration.accessToken,
        }, remember);
        this.rememberLogin(number, name, remember);
        useAlert(registration.message)
        return useRedirect('/');
      }
    },
    async login(number: string, password: string, remember = true, name = '') {
      const login = await useApi().fetch('POST', '/user/login', {
        body: {
          number, password
        },
      });
      if (login.user) {
        this.user = login.user
      }
      if (login?.accessToken && login?.refreshToken) {
        this.saveTokens({
          refreshToken: login.refreshToken,
          accessToken: login.accessToken,
        }, remember);
        this.rememberLogin(number, name || login.user?.name || '', remember);
        useAlert(login.message)
        const target = login.user?.role === 'ADMIN' ? '/admin' : '/profiles';
        return useRedirect(target);
      }
    },

    async saveTokens(tokens: { accessToken: string, refreshToken: string }, remember = true) {
      const refreshMaxAge = remember ? REFRESH_TOKEN_MAX_AGE_REMEMBER : REFRESH_TOKEN_MAX_AGE;
      const accessToken = useCookie('accessToken', cookieOptions(ACCESS_TOKEN_MAX_AGE));
      const refreshToken = useCookie('refreshToken', cookieOptions(refreshMaxAge));
      refreshToken.value = tokens.refreshToken;
      accessToken.value = tokens.accessToken;
    },

    rememberLogin(number: string, name: string, remember: boolean) {
      if (!process.client) return;
      try {
        if (remember && number) {
          localStorage.setItem(LAST_LOGIN_KEY, number);
          if (name) localStorage.setItem(LAST_LOGIN_NAME_KEY, name);
          localStorage.setItem(REMEMBER_FLAG_KEY, '1');
        } else {
          localStorage.removeItem(LAST_LOGIN_KEY);
          localStorage.removeItem(LAST_LOGIN_NAME_KEY);
          localStorage.removeItem(REMEMBER_FLAG_KEY);
        }
      } catch (e) {
        // localStorage недоступен (приватный режим) — молча пропускаем
      }
    },

    getSavedLogin(): { number: string, name: string, remember: boolean } {
      if (!process.client) return { number: '', name: '', remember: true };
      try {
        return {
          number: localStorage.getItem(LAST_LOGIN_KEY) || '',
          name: localStorage.getItem(LAST_LOGIN_NAME_KEY) || '',
          remember: localStorage.getItem(REMEMBER_FLAG_KEY) !== '0',
        };
      } catch (e) {
        return { number: '', name: '', remember: true };
      }
    },

    logout() {
      const accessToken = useCookie('accessToken');
      const refreshToken = useCookie('refreshToken');
      accessToken.value = null;
      refreshToken.value = null;
      this.user = undefined;
      return useRedirect('/auth');
    },

    async refresh() {
      const accessToken = useCookie('accessToken');
      const refreshToken = useCookie('refreshToken');
      const remember = this.getSavedLogin().remember;
      try {
        const fetchByAccess: { accessToken: string, refreshToken: string, user: IUser } = await useApi().fetch('POST', '/user/refresh', {
          body: {
            token: refreshToken.value
          }
        })
        if (fetchByAccess.user) {
          this.user = fetchByAccess.user
        }
        this.saveTokens({
          refreshToken: fetchByAccess.refreshToken,
          accessToken: fetchByAccess.accessToken,
        }, remember);
      } catch (e) {
        try {
          const fetchByRefresh: { accessToken: string, refreshToken: string } = await useApi().fetch('POST', '/user/refresh', {
            body: {
              token: refreshToken.value
            }
          })
          this.saveTokens({
            refreshToken: fetchByRefresh.refreshToken,
            accessToken: fetchByRefresh.accessToken,
          }, remember);
        } catch (e) {
          accessToken.value = null;
          refreshToken.value = null;
          return navigateTo('/auth');
        }
      }
    },

    async getAll() {
      const users = await useApi().fetch('GET', '/user/', {});

      if (users) {
        this.users = users
      }
    },

    async changeStatus(userId: number) {


      const user = await useApi().fetch('PATCH', '/user/accept', {
        body: {
          userId
        }
      });

      if (user) {
        this.users.forEach((element, index) => {
          if (element.id == user.id) {
            this.users[index] = element
          }
        });



      }
    },

    async setFilter(filterValue: string) {
      this.filter = filterValue
    }
  },
  getters: {
    getUser({ user }) {
      return user
    },
    getUsers({ users, filter }) {
      if (filter) {
        const filteredUsers = users.filter(user => {
          // Проверяем, содержится ли часть строки в свойстве 'name' или 'number'
          return user.name.includes(filter) || user.number.includes(filter);
        });
        return filteredUsers
      }
      return users
    }
  }
});