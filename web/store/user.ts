import type { IUser } from "~/interfaces/IUser";


export const useUserStore = defineStore('user', {
  state: (): { filter: string, user: IUser | undefined, users: Pick<IUser, 'name' | 'number' | 'id' | 'status'>[] } => ({
    user: undefined,
    users: [],
    filter: ''
  }),
  actions: {
    async exist(number: string, password: string, name: string) {

      const data = await useApi().fetch('POST', '/user/exist', { body: { number } })
      if (data.exist) {
        return await this.login(number, password)
      }
      await this.registration(number, password, name)
    },
    async registration(number: string, password: string, name: string) {
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
        });
        useAlert(registration.message)
        return useRedirect('/');
      }
    },
    async login(number: string, password: string) {
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
        });
        useAlert(login.message)
        return useRedirect('/profiles');
      }
    },

    async saveTokens(tokens: { accessToken: string, refreshToken: string }) {
      const accessToken = useCookie('accessToken');
      const refreshToken = useCookie('refreshToken');
      refreshToken.value = tokens.refreshToken;
      accessToken.value = tokens.accessToken;
    },

    async refresh() {
      const accessToken = useCookie('accessToken');
      const refreshToken = useCookie('refreshToken');
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
        });
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
          });
        } catch (e) {
          accessToken.value = null;
          refreshToken.value = null;
          return navigateTo('/admin/auth');
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