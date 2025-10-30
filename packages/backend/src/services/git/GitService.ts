import { IGitService } from '../../core/interfaces/IGitService';
import { CacheService, CACHE_KEYS } from '../../infrastructure/cache/CacheService';
import { config } from '../../config';
import type {
  GitStatus,
  Commit,
  LogOptions,
  Branch,
  Diff,
  DiffOptions,
  FileNode,
} from '@forkweb/shared';

// GitService with caching layer
export class GitService implements IGitService {
  constructor(
    private adapter: IGitService,
    private cache: CacheService
  ) {}

  async clone(url: string, path: string): Promise<void> {
    return this.adapter.clone(url, path);
  }

  async init(path: string): Promise<void> {
    return this.adapter.init(path);
  }

  async status(repoPath: string): Promise<GitStatus> {
    const cacheKey = CACHE_KEYS.status(repoPath);
    
    // Try cache first
    const cached = await this.cache.get<GitStatus>(cacheKey);
    if (cached) return cached;

    // Fetch from adapter
    const status = await this.adapter.status(repoPath);

    // Cache with short TTL
    await this.cache.set(cacheKey, status, {
      ttl: config.cache.ttl.status,
      tags: ['status', repoPath],
    });

    return status;
  }

  async currentBranch(repoPath: string): Promise<string> {
    return this.adapter.currentBranch(repoPath);
  }

  async log(repoPath: string, options?: LogOptions): Promise<Commit[]> {
    const branch = options?.branch || 'HEAD';
    const limit = options?.maxCount || 1000;
    const cacheKey = CACHE_KEYS.commits(repoPath, branch, limit);

    // Try cache first
    const cached = await this.cache.get<Commit[]>(cacheKey);
    if (cached) return cached;

    // Fetch from adapter
    const commits = await this.adapter.log(repoPath, options);

    // Cache with longer TTL and persistence
    await this.cache.set(cacheKey, commits, {
      ttl: config.cache.ttl.commits,
      persist: true,
      tags: ['commits', repoPath],
    });

    return commits;
  }

  async show(repoPath: string, commitSHA: string): Promise<Commit> {
    return this.adapter.show(repoPath, commitSHA);
  }

  async branches(repoPath: string): Promise<Branch[]> {
    const cacheKey = CACHE_KEYS.branches(repoPath);

    // Try cache first
    const cached = await this.cache.get<Branch[]>(cacheKey);
    if (cached) return cached;

    // Fetch from adapter
    const branches = await this.adapter.branches(repoPath);

    // Cache with moderate TTL
    await this.cache.set(cacheKey, branches, {
      ttl: config.cache.ttl.branches,
      tags: ['branches', repoPath],
    });

    return branches;
  }

  async createBranch(repoPath: string, name: string, startPoint?: string): Promise<void> {
    return this.adapter.createBranch(repoPath, name, startPoint);
  }

  async deleteBranch(repoPath: string, name: string, force?: boolean): Promise<void> {
    return this.adapter.deleteBranch(repoPath, name, force);
  }

  async checkout(repoPath: string, branch: string): Promise<void> {
    return this.adapter.checkout(repoPath, branch);
  }

  async stage(repoPath: string, files: string[]): Promise<void> {
    return this.adapter.stage(repoPath, files);
  }

  async unstage(repoPath: string, files: string[]): Promise<void> {
    return this.adapter.unstage(repoPath, files);
  }

  async commit(repoPath: string, message: string, options?: { amend?: boolean }): Promise<string> {
    return this.adapter.commit(repoPath, message, options);
  }

  async diff(repoPath: string, options: DiffOptions): Promise<Diff[]> {
    const staged = options.staged || false;
    const filePath = options.path || '';
    const cacheKey = CACHE_KEYS.diff(repoPath, filePath, staged);

    // Try cache first (short TTL)
    const cached = await this.cache.get<Diff[]>(cacheKey);
    if (cached) return cached;

    // Fetch from adapter
    const diff = await this.adapter.diff(repoPath, options);

    // Cache briefly
    await this.cache.set(cacheKey, diff, {
      ttl: 10000, // 10 seconds
      tags: ['diff', repoPath],
    });

    return diff;
  }

  async tree(repoPath: string, ref: string = 'HEAD'): Promise<FileNode[]> {
    const cacheKey = CACHE_KEYS.tree(repoPath, ref);

    // Try cache first
    const cached = await this.cache.get<FileNode[]>(cacheKey);
    if (cached) return cached;

    // Fetch from adapter
    const tree = await this.adapter.tree(repoPath, ref);

    // Cache with moderate TTL (longer for historical refs)
    const ttl = ref === 'HEAD' ? 30000 : config.cache.ttl.files;
    await this.cache.set(cacheKey, tree, {
      ttl,
      persist: ref !== 'HEAD',
      tags: ['tree', repoPath],
    });

    return tree;
  }

  async readFile(repoPath: string, filePath: string, ref: string = 'HEAD'): Promise<string> {
    const cacheKey = CACHE_KEYS.fileContent(repoPath, ref, filePath);

    // Try cache first
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    // Fetch from adapter
    const content = await this.adapter.readFile(repoPath, filePath, ref);

    // Cache file content (infinite TTL for historical commits)
    await this.cache.set(cacheKey, content, {
      ttl: ref === 'HEAD' ? 2000 : Infinity,
      persist: ref !== 'HEAD',
      tags: ['file', repoPath],
    });

    return content;
  }

  async fetch(repoPath: string, remote?: string): Promise<void> {
    return this.adapter.fetch(repoPath, remote);
  }

  async pull(repoPath: string, options?: { remote?: string; branch?: string; rebase?: boolean }): Promise<void> {
    return this.adapter.pull(repoPath, options);
  }

  async push(repoPath: string, options?: { remote?: string; branch?: string; force?: boolean }): Promise<void> {
    return this.adapter.push(repoPath, options);
  }

  async isRepository(path: string): Promise<boolean> {
    return this.adapter.isRepository(path);
  }
}
