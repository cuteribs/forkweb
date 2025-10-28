import { CacheService } from '../infrastructure/cache/CacheService';
import { SimpleGitAdapter } from '../infrastructure/git/SimpleGitAdapter';
import { FileSystemWatcher, CacheInvalidator } from '../infrastructure/watchers/FileSystemWatcher';
import { RepositoryService } from './repository/RepositoryService';
import { GitService } from './git/GitService';
import { logger } from '../utils/logger';

export interface Services {
  cache: CacheService;
  gitAdapter: SimpleGitAdapter;
  git: GitService;
  repository: RepositoryService;
  watcher: FileSystemWatcher;
  invalidator: CacheInvalidator;
}

export async function initializeServices(): Promise<Services> {
  logger.info('Initializing services...');

  // Initialize cache service
  const cache = new CacheService();
  await cache.initialize();

  // Initialize Git adapter
  const gitAdapter = new SimpleGitAdapter();

  // Initialize Git service with caching
  const git = new GitService(gitAdapter, cache);

  // Initialize repository service
  const repository = new RepositoryService(gitAdapter);
  await repository.initialize();

  // Initialize file system watcher
  const watcher = new FileSystemWatcher(cache);

  // Initialize cache invalidator
  const invalidator = new CacheInvalidator(cache);

  // Watch all existing repositories
  const repositories = await repository.list();
  for (const repo of repositories) {
    watcher.watchRepository(repo.path);
  }

  logger.info('All services initialized successfully');

  return {
    cache,
    gitAdapter,
    git,
    repository,
    watcher,
    invalidator,
  };
}
