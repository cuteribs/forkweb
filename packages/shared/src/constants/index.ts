export const GIT_STATUS = {
  ADDED: 'added',
  MODIFIED: 'modified',
  DELETED: 'deleted',
  RENAMED: 'renamed',
  COPIED: 'copied',
} as const;

export const BRANCH_TYPE = {
  LOCAL: 'local',
  REMOTE: 'remote',
} as const;

export const DEFAULT_CONFIG = {
  SERVER_PORT: 3001,
  SERVER_HOST: 'localhost',
  MAX_COMMITS: 100,
  DIFF_CONTEXT: 3,
  COMMIT_PAGE_SIZE: 50,
  CACHE_TTL_STATUS: 3000,      // 3 seconds
  CACHE_TTL_BRANCHES: 15000,   // 15 seconds
  CACHE_TTL_COMMITS: 300000,   // 5 minutes
  CACHE_MAX_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

export const API_ENDPOINTS = {
  REPOSITORIES: '/api/repositories',
  COMMITS: '/api/repositories/:id/commits',
  BRANCHES: '/api/repositories/:id/branches',
  STATUS: '/api/repositories/:id/status',
  STAGE: '/api/repositories/:id/stage',
  UNSTAGE: '/api/repositories/:id/unstage',
  COMMIT: '/api/repositories/:id/commit',
  CHECKOUT: '/api/repositories/:id/checkout',
  PULL: '/api/repositories/:id/pull',
  PUSH: '/api/repositories/:id/push',
  FETCH: '/api/repositories/:id/fetch',
  TREE: '/api/repositories/:id/tree',
  BLOB: '/api/repositories/:id/blob',
  DIFF: '/api/repositories/:id/diff',
} as const;

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  SUBSCRIBE_REPO: 'subscribe:repository',
  UNSUBSCRIBE_REPO: 'unsubscribe:repository',
  REPO_CHANGED: 'repository:changed',
  OPERATION_PROGRESS: 'operation:progress',
  OPERATION_COMPLETE: 'operation:complete',
  OPERATION_ERROR: 'operation:error',
} as const;

export const ERROR_CODES = {
  REPO_NOT_FOUND: 'REPO_NOT_FOUND',
  REPO_INVALID: 'REPO_INVALID',
  GIT_ERROR: 'GIT_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
