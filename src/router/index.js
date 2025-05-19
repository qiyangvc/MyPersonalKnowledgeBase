import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Welcome',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/mainweb',
    name: 'MainWeb',
    component: () => import('@/views/MainWeb.vue'),
    redirect: '/mainweb/resource',
    children: [
      {
        path: 'resource',
        name: 'Resource',
        component: () => import('@/views/ResourceView.vue')
      },
      {
        path: 'workbench',
        name: 'Workbench',
        component: () => import('@/views/WorkbenchView.vue')
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/ScheduleView.vue')
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router