import chokidar, { FSWatcher } from 'chokidar';
import { CacheService } from '../cache/CacheService';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import type { GitOperation } from '@forkweb/shared';

export class FileSystemWatcher {
  private watchers: Map<string, FSWatcher> = new Map();
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  watchRepository(repoPath: string): void {
    if (this.watchers.has(repoPath)) {
      return; // Already watching
    }

    if (!config.repositories.watchChanges) {
      return;
    }

    const watcher = chokidar.watch(repoPath, {
      ignored: [
        /(^|[\/\\])\../, // Ignore hidden files
        /node_modules/,
        /dist/,
        /build/,
      ],
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    // Watch for file changes in working directory
    watcher.on('change', (path) => {
      this.cacheService.invalidate([
        `status:${repoPath}`,
        `tree:${repoPath}`,
      ]);
      logger.debug(`File changed: ${path}, invalidated cache`);
    });

    watcher.on('add', (path) => {
      this.cacheService.invalidate([`status:${repoPath}`]);
      logger.debug(`File added: ${path}, invalidated cache`);
    });

    watcher.on('unlink', (path) => {
      this.cacheService.invalidate([`status:${repoPath}`]);
      logger.debug(`File deleted: ${path}, invalidated cache`);
    });

    this.watchers.set(repoPath, watcher);
    logger.info(`Started watching repository: ${repoPath}`);
  }

  unwatchRepository(repoPath: string): void {
    const watcher = this.watchers.get(repoPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(repoPath);
      logger.info(`Stopped watching repository: ${repoPath}`);
    }
  }

  unwatchAll(): void {
    for (const [repoPath, watcher] of this.watchers.entries()) {
      watcher.close();
      logger.info(`Stopped watching repository: ${repoPath}`);
    }
    this.watchers.clear();
  }
}

// Cache invalidation rules based on Git operations
export class CacheInvalidator {
  private static readonly INVALIDATION_MAP: Record<GitOperation, string[]> = {
    clone: [],
    commit: ['status', 'commits', 'tree', 'branches'],
    checkout: ['status', 'branches', 'tree'],
    'branch:create': ['branches'],
    'branch:delete': ['branches'],
    stage: ['status'],
    unstage: ['status'],
    discard: ['status'],
    pull: ['commits', 'status', 'branches', 'remote'],
    push: ['remote'],
    fetch: ['branches', 'remote', 'commits'],
    merge: ['commits', 'status', 'branches'],
    rebase: ['commits', 'status'],
    reset: ['status', 'commits', 'tree'],
    stash: ['status'],
  };

  constructor(private cacheService: CacheService) {}

  invalidateAfter(operation: GitOperation, repoPath: string): void {
    const toInvalidate = CacheInvalidator.INVALIDATION_MAP[operation] || [];
    const patterns = toInvalidate.map(type => `${type}:${repoPath}`);
    
    this.cacheService.invalidate(patterns);
    logger.debug(`Invalidated cache after operation: ${operation}`);
  }
}
