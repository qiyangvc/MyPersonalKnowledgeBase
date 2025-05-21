// src/api/auth.js
import axios from 'axios'
import { mockApi } from '@/mock/mockApi'

const API_URL = 'http://localhost:8080/api/auth' /*暂定*/
const RESOURCE_API_URL = 'http://localhost:8080/api/resource' /*资源API地址*/

// 使用模拟数据的标志
const USE_MOCK_DATA = true;

export default {
  // 登录
  login(credentials) {
    return axios.post(`${API_URL}/login`, credentials)
  },
  
  // 注册
  register(userData) {
    return axios.post(`${API_URL}/register`, userData)
  },

  // 重置密码请求
  requestReset(email) {
    return axios.post(`${API_URL}/request-reset`, { email })
  },

  // 获取资源文件树
  getResourceTree() {
    if (USE_MOCK_DATA) {
      return mockApi.getResourceTree();
    }
    return axios.get(`${RESOURCE_API_URL}/tree`);
  },
  
  // 获取文件内容
  getFileContent(url) {
    if (USE_MOCK_DATA) {
      return mockApi.getFileContent(url);
    }
    return axios.get(url);
  }
}