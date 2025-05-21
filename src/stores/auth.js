import { defineStore } from 'pinia'
import authApi from '@/api/auth' 
export const useAuthStore = defineStore('auth', {
  actions: {
    async login(credentials) {
      
      try {
        const response = await authApi.login(credentials)
        localStorage.setItem('isAuthenticated', true)
        return response
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },
    async register(userData) {
      try {
        const response = await authApi.register(userData)
        return response
      } catch (error) {
        console.error('Registration failed:', error)
        throw error
      }
    },
    async requestReset(email) {
      try {
        const response = await authApi.requestReset(email)
        return response
      } catch (error) {
        console.error('Password reset request failed:', error)
        throw error
      }
    },
    logout() {
      localStorage.removeItem('isAuthenticated')
    }
  }
})