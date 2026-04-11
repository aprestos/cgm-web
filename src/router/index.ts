import { createRouter, createWebHistory } from 'vue-router'
import {
  navigationGuard,
  type RouteGuard,
  hasAnyOfRoles,
} from '@/router/guards'
import { RouteNames } from '@/router/routeNames.ts'
import HomeView from '../views/public/HomeView.vue'

// Extend Vue Router's RouteMeta interface
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guard?: RouteGuard
    permission?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      name: RouteNames.public.home,
      component: (): Promise<unknown> =>
        import('../views/public/PageLanding.vue'),
    },
    {
      path: '',
      component: HomeView,
      children: [
        {
          path: 'library',
          name: RouteNames.public.library,
          component: (): Promise<unknown> =>
            import('@/views/public/library/PageLibraryHome.vue'),
        },
        {
          path: 'flea-market',
          name: RouteNames.public.fleaMarket,
          component: (): Promise<unknown> =>
            import('@/views/public/flea-market/PageFleaMarketHome.vue'),
        },
      ],
    },
    {
      path: '/auth',
      component: (): Promise<unknown> =>
        import('../views/auth/_templates/AuthTemplateView.vue'),
      children: [
        {
          path: 'sign-in',
          name: RouteNames.auth.signIn,
          component: (): Promise<unknown> =>
            import('../views/auth/SignInView.vue'),
        },
        {
          path: 'confirm',
          name: RouteNames.auth.confirm,
          component: (): Promise<unknown> =>
            import('../views/auth/SignInConfirmation.vue'),
        },
      ],
    },
    {
      path: '/admin',
      component: (): Promise<unknown> => import('../views/admin/HomeView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'admin',
        guard: (): Promise<boolean> => hasAnyOfRoles(['admin', 'staff']),
      },
      children: [
        {
          path: '',
          name: RouteNames.admin.dashboard,
          component: (): Promise<unknown> =>
            import('../views/admin/dashboard/DashboardHome.vue'),
        },
        {
          path: 'library',
          name: RouteNames.admin.library,
          component: (): Promise<unknown> =>
            import('../views/admin/library/PageLibraryHome.vue'),
        },
        {
          path: 'events',
          name: RouteNames.admin.events,
          component: (): Promise<unknown> =>
            import('../views/admin/events/EventsHome.vue'),
        },
        {
          path: 'tournaments',
          name: RouteNames.admin.tournaments,
          component: (): Promise<unknown> =>
            import('../views/admin/tournaments/HomeView.vue'),
        },
        {
          path: 'tickets',
          name: RouteNames.admin.tickets,
          component: (): Promise<unknown> =>
            import('../views/admin/tickets/PageTicketsHome.vue'),
        },
        {
          path: 'settings',
          component: (): Promise<unknown> =>
            import('../views/admin/settings/SettingsView.vue'),
          children: [
            {
              path: '',
              redirect: { name: RouteNames.admin.settingsOrganization },
            },
            {
              path: 'organization',
              name: RouteNames.admin.settingsOrganization,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/organization/OrganizationSettings.vue'),
            },
            {
              path: 'edition',
              name: RouteNames.admin.settingsEdition,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/edition/EditionSettings.vue'),
            },
            {
              path: 'features',
              name: RouteNames.admin.settingsFeatures,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/features/FeaturesSettings.vue'),
            },
            {
              path: 'library',
              name: RouteNames.admin.settingsLibrary,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/library/LibrarySettings.vue'),
            },
            {
              path: 'tournaments',
              name: RouteNames.admin.settingsTournaments,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/tournaments/TournamentsSettings.vue'),
            },
            {
              path: 'tickets',
              name: RouteNames.admin.settingsTickets,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/tickets/TicketsSettings.vue'),
            },
            {
              path: 'events-module',
              name: RouteNames.admin.settingsEventsModule,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/events/EventsModuleSettings.vue'),
            },
            {
              path: 'flea-market',
              name: RouteNames.admin.settingsFleaMarket,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/flea-market/FleaMarketSettings.vue'),
            },
            {
              path: 'advanced',
              name: RouteNames.admin.settingsAdvanced,
              component: (): Promise<unknown> =>
                import('../views/admin/settings/advanced/AdvancedSettings.vue'),
            },
          ],
        },
      ],
    },
    {
      path: '/users/:id',
      name: RouteNames.public.user,
      component: (): Promise<unknown> =>
        import('../views/public/PageUserProfile.vue'),
    },
    {
      path: '/not-found',
      name: RouteNames.error.notFound,
      component: (): Promise<unknown> => import('../views/NotFoundView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/not-found',
    },
  ],
})

// Route guard using the Vue 2 style approach
router.beforeEach(navigationGuard)

export default router
