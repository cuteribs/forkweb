import { createRouter, createWebHistory } from 'vue-router';
import RepositoryLayout from '@/views/RepositoryLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/repositories',
    },
    {
      path: '/repositories',
      name: 'repositories',
      component: RepositoryLayout,
      children: [
        {
          path: '',
          name: 'repository-list',
          component: () => import('@/views/RepositoryList.vue'),
        },
        {
          path: ':id',
          name: 'repository-detail',
          component: () => import('@/views/RepositoryDetail.vue'),
          redirect: { name: 'repository-changes' },
          children: [
            {
              path: 'changes',
              name: 'repository-changes',
              component: () => import('@/views/Changes.vue'),
            },
            {
              path: 'commits',
              name: 'repository-commits',
              component: () => import('@/views/Commits.vue'),
            },
            {
              path: 'branches',
              name: 'repository-branches',
              component: () => import('@/views/Branches.vue'),
            },
            {
              path: 'files',
              name: 'repository-files',
              component: () => import('@/views/Files.vue'),
            },
          ],
        },
      ],
    },
  ],
});

export default router;
