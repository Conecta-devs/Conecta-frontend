import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../services/session'

const publicRoutes = ['/', '/landpage', '/login']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      alias: '/landpage',
      name: 'Landpage',
      component: () => import('../components/pages/Landpage.vue'),
    },
    {
      path: '/dashboard',
      component: () => import('../components/pages/Base.vue'),
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('../components/pages/Dashboard.vue'),
        },
        {
          path: 'chat',
          component: () => import('../components/pages/chat.vue'),
          meta: { hideHeader: true },
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../components/pages/Login.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/landpage',
    },
  ],
})

router.beforeEach((to) => {
  const authenticated = isAuthenticated()
  const isPublicRoute = publicRoutes.includes(to.path)
  const isDashboardRoute = to.path === '/dashboard' || to.path.startsWith('/dashboard/')

  if (to.path === '/login' && authenticated) {
    return '/dashboard'
  }

  if (authenticated) {
    if (isDashboardRoute || to.path === '/landpage' || to.path === '/') {
      return true
    }

    return '/landpage'
  }

  if (isPublicRoute) {
    return true
  }

  return '/login'
})

export default router
