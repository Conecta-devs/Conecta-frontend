import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Landpage',
      component: () => import('../components/pages/Landpage.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../components/pages/Dashboard.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../components/pages/Login.vue'),
    },
  ],
})

export default router
