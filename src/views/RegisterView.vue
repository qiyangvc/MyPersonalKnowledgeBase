<!-- Register.vue -->
<template>
    <div class="login-container">
      <form @submit.prevent="handleSubmit" class="login-form">
        <h2>用户注册</h2>
        
        <div class="form-group">
          <label>用户名</label>
          <input 
            type="text" 
            v-model="form.userName" 
            required
            @input="validateField('userName')"
          />
          <span class="error" v-if="errors.userName">{{ errors.userName }}</span>
        </div>
  
        <div class="form-group">
          <label>邮箱</label>
          <input 
            type="email" 
            v-model="form.email" 
            required
            @input="validateField('email')"
          />
          <span class="error" v-if="errors.email">{{ errors.email }}</span>
        </div>
  
        <div class="form-group">
          <label>密码</label>
          <input 
            type="password" 
            v-model="form.password" 
            required
            @input="validateField('password')"
          >
          <span class="error" v-if="errors.password">{{ errors.password }}</span>
        </div>
  
        <div class="form-group">
          <label>确认密码</label>
          <input 
            type="password" 
            v-model="form.confirmPassword" 
            required
            @input="validateField('confirmPassword')"
          >
          <span class="error" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</span>
        </div>
  
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '注册中...' : '注册' }}
        </button>
        <div class="form-group">
          <label>
            已有账号？<router-link to="/login">登录</router-link>
          </label>
        </div>
        <div class="error" v-if="registerError">{{ registerError }}</div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const form = reactive({
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const errors = reactive({
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const isSubmitting = ref(false)
  const registerError = ref('')
  
  const validationRules = {
    userName: value => value.length >= 3 || '用户名至少3个字符',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '邮箱格式不正确',
    password: value => value.length >= 6 || '密码至少6个字符',
    confirmPassword: value => 
      value === form.password || '两次输入的密码不一致'
  }
  
  const validateField = (field) => {
    errors[field] = validationRules[field](form[field]) || ''
  }
  
  const handleSubmit = async () => {
    Object.keys(form).forEach(field => validateField(field))
    if (Object.values(errors).some(error => error)) return
  
    try {
      isSubmitting.value = true
      await authStore.register({userName:form.userName, emailbox:form.email, password:form.password})
      router.push('/login')
    } catch (error) {
      registerError.value = error.message || '注册失败'
    } finally {
      isSubmitting.value = false
    }
  }
  </script>
  <style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: min(90vw, 600px); /* 最大600px，最小90%视宽 */
    min-height: min(80vh, 560px); /* 高度自适应 */
    background: white;
  }
  @media (min-width: 768px) {
  .login-form {
    padding: 4rem 3rem; /* 大屏增加内边距 */
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
  }
}
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
  }
  
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  button {
    width: 100%;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
  
  .error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  </style>