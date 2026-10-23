import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../shared/services/session'

const publicRoutes = [
  '/',
  '/landpage',
  '/catalog',
  '/landpage-v2',
  '/login',
  '/login-v2',
  '/conta-criada',
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      alias: '/landpage',
      name: 'Landpage',
      component: () => import('../features/landpage/legacy/Landpage.vue'),
    },
    {
      path: '/catalog',
      name: 'Catalog',
      component: () => import('../features/catalog/Catalog.vue'),
    },
    {
      path: '/landpage-v2',
      name: 'LandpageV2',
      component: () => import('../features/landpage/pages/LandpageV2.vue'),
    },
    {
      path: '/login-v2',
      name: 'LoginV2',
      component: () => import('../features/auth/pages/LoginV2.vue'),
    },
    {
      path: '/conta-criada',
      name: 'ContaCriada',
      component: () => import('../features/auth/pages/LoginV2.vue'),
      props: { estadoInicial: 'criado' },
    },
    {
      path: '/dashboard',
      component: () => import('../layouts/DashboardLayout.vue'),
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('../features/dashboard/pages/Dashboard.vue'),
        },
        {
          path: 'chat',
          component: () => import('../features/dashboard/pages/Chat.vue'),
          meta: { hideHeader: true },
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../features/auth/legacy/Login.vue'),
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
    if (isDashboardRoute || isPublicRoute) {
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
