import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  actions: {
    async login(credentials) {
      // 模拟API调用
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (credentials.username === 'admin' && credentials.password === '123456') {
            localStorage.setItem('isAuthenticated', 'true')
            resolve()
          } else {
            reject(new Error('无效的凭证'))
          }
        }, 1000)
      })
    },
    logout() {
      localStorage.removeItem('isAuthenticated')
    }
  }
})