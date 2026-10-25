import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../services/session'

const publicRoutes = ['/', '/landpage', '/login', '/forgot-password', '/reset-password']

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
        {
          path: 'communities',
          name: 'Communities',
          component: () => import('../components/pages/Communities.vue'),
        },
        {
          path: 'agenda',
          name: 'Agenda',
          component: () => import('../components/pages/Agenda.vue'),
        },
        {
        path: 'posts',
        name: 'Posts',
        component: () => import('../components/pages/Posts.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../components/pages/Login.vue'),
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('../components/pages/ForgotPassword.vue'),
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../components/pages/ResetPassword.vue'),
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
