import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

/**
 * Vue Router Configuration
 * Auto-generates routes from hierarchical navigation structure
 * Created By: DatND (13/1/2026)
 */

/**
 * Convert flat routes to Vue Router route records.
 * Created By: DatND (13/1/2026)
 */
const routes: RouteRecordRaw[] = [
  // Root redirect
  {
    path: '/',
    redirect: '/production/dictionary/shift'
  },
  // Shift Dictionary - Implemented route
  {
    path: '/production/dictionary/shift',
    name: 'ShiftDictionary',
    component: () => import('../views/production/dictionary/shift/ShiftRoot.vue'),
    meta: {
      title: 'Shift Dictionary',
      implemented: true
    }
  },
  // 404 catch-all route - All other paths
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotImplemented.vue'),
    meta: {
      title: 'Không tìm thấy trang',
      implemented: false
    }
  }
];

/**
 * Create and configure router instance.
 * Created By: DatND (13/1/2026)
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

/**
 * Global navigation guard for route transition.
 * Created By: DatND (13/1/2026)
 */
router.beforeEach((to, _from, next) => {
  // Update document title
  const title = to.meta.title as string;
  if (title) {
    document.title = `${title} - Production Management`;
  }

  next();
});

export default router;
