import { defineStore } from 'pinia'
import authApi from '@/api/auth' 

export const useAuthStore = defineStore('auth', {
  state: () => ({
    resourceTree: [],
    currentFile: null,
    currentFileContent: '',
    isLoadingTree: false,
    isLoadingContent: false,
    treeError: null,
    contentError: null
  }),
  
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
    },
    
    // 获取资源树
    async fetchResourceTree() {
      this.isLoadingTree = true
      this.treeError = null
      
      try {
        const response = await authApi.getResourceTree()
        this.resourceTree = response.data
        return this.resourceTree
      } catch (error) {
        console.error('Failed to fetch resource tree:', error)
        this.treeError = error.message || '获取资源树失败'
        throw error
      } finally {
        this.isLoadingTree = false
      }
    },
    
    // 获取文件内容
    async fetchFileContent(url) {
      this.isLoadingContent = true
      this.contentError = null
      
      try {
        const response = await authApi.getFileContent(url)
        this.currentFileContent = response.data
        return this.currentFileContent
      } catch (error) {
        console.error('Failed to fetch file content:', error)
        this.contentError = error.message || '获取文件内容失败'
        this.currentFileContent = ''
        throw error
      } finally {
        this.isLoadingContent = false
      }
    },
    
    // 设置当前选中文件
    setCurrentFile(file) {
      this.currentFile = file
    },
    
    // 更新当前文件内容
    updateCurrentFileContent(content) {
      this.currentFileContent = content
    }
  }
})