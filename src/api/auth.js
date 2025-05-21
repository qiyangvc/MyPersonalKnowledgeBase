// src/api/auth.js
import axios from 'axios'

const API_URL = 'http://localhost:8080/api/auth' /*暂定*/

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

}