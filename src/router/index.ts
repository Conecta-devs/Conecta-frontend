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
  '/forgot-password',
  '/reset-password',
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
        {
          path: 'communities',
          name: 'Communities',
          component: () => import('../features/dashboard/pages/Communities.vue'),
        },
        {
          path: 'agenda',
          name: 'Agenda',
          component: () => import('../features/dashboard/pages/Agenda.vue'),
        },
        {
          path: 'posts',
          name: 'Posts',
          component: () => import('../features/dashboard/pages/Posts.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../features/auth/legacy/Login.vue'),
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('../features/auth/pages/ForgotPassword.vue'),
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../features/auth/pages/ResetPassword.vue'),
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
  const isPasswordRecoveryRoute =
    to.path === '/forgot-password' || to.path === '/reset-password'

  if (isPasswordRecoveryRoute) {
    return true
  }

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
