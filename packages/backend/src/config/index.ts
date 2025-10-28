import { config as dotenvConfig } from 'dotenv';
import { DEFAULT_CONFIG } from '@forkweb/shared';
import type { AppConfig } from '@forkweb/shared';

dotenvConfig();

export const config: AppConfig = {
  server: {
    port: parseInt(process.env.PORT || String(DEFAULT_CONFIG.SERVER_PORT), 10),
    host: process.env.HOST || DEFAULT_CONFIG.SERVER_HOST,
    autoStart: process.env.AUTO_START === 'true',
  },
  git: {
    defaultBranch: process.env.GIT_DEFAULT_BRANCH || 'main',
    diffContext: parseInt(process.env.GIT_DIFF_CONTEXT || String(DEFAULT_CONFIG.DIFF_CONTEXT), 10),
    maxCommits: parseInt(process.env.GIT_MAX_COMMITS || String(DEFAULT_CONFIG.MAX_COMMITS), 10),
    fetchTimeout: 30000,
  },
  ui: {
    theme: 'auto',
    language: 'en',
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    commitPageSize: DEFAULT_CONFIG.COMMIT_PAGE_SIZE,
  },
  repositories: {
    recentLimit: 10,
    autoDiscover: false,
    excludePaths: ['/node_modules/', '/.git/', '/dist/', '/build/'],
    watchChanges: process.env.REPO_WATCH_CHANGES === 'true',
  },
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || String(DEFAULT_CONFIG.CACHE_MAX_SIZE), 10),
    ttl: {
      status: DEFAULT_CONFIG.CACHE_TTL_STATUS,
      branches: DEFAULT_CONFIG.CACHE_TTL_BRANCHES,
      commits: DEFAULT_CONFIG.CACHE_TTL_COMMITS,
      files: Infinity, // Never expire file content
    },
    persistence: process.env.CACHE_PERSISTENCE === 'true',
  },
};
