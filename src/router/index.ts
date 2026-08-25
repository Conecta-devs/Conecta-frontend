import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Landpage',
      component: () => import('../components/Landpage.vue'),
    },
  ],
})

export default router
