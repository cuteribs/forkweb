import { LRUCache } from 'lru-cache';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs/promises';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

interface CacheData {
  [key: string]: CacheEntry;
}

export interface CacheOptions {
  ttl?: number;
  persist?: boolean;
  tags?: string[];
}

export class CacheService {
  private memory: LRUCache<string, CacheEntry>;
  private disk?: Low<CacheData>;
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), '.forkweb');
    
    // Initialize in-memory LRU cache
    this.memory = new LRUCache({
      max: 500,
      maxSize: config.cache.maxSize,
      sizeCalculation: (value) => this.estimateSize(value),
      ttl: config.cache.ttl.status,
      updateAgeOnGet: true,
      ttlAutopurge: true,
    });

    logger.info('Cache service initialized');
  }

  async initialize(): Promise<void> {
    if (config.cache.persistence) {
      // Ensure cache directory exists
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      const dbPath = path.join(this.cacheDir, 'cache.json');
      this.disk = new Low(new JSONFile<CacheData>(dbPath), {});
      await this.disk.read();
      this.disk.data ||= {};
      
      logger.info('Persistent cache initialized');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fast path)
    const memValue = this.memory.get(key);
    if (memValue) {
      return memValue.data as T;
    }

    // Try disk cache if available (slower path)
    if (this.disk) {
      await this.disk.read();
      const diskValue = this.disk.data[key];
      if (diskValue && !this.isExpired(diskValue)) {
        // Promote to memory cache
        this.memory.set(key, diskValue);
        return diskValue.data as T;
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: options.ttl || config.cache.ttl.status,
      tags: options.tags,
    };

    // Always set in memory cache
    this.memory.set(key, entry, { ttl: entry.ttl });

    // Optionally persist expensive data
    if (options.persist && this.disk) {
      await this.disk.read();
      this.disk.data[key] = entry;
      await this.disk.write();
    }
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);

    if (this.disk) {
      await this.disk.read();
      delete this.disk.data[key];
      await this.disk.write();
    }
  }

  invalidate(pattern: string | string[]): void {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    for (const key of this.memory.keys()) {
      if (patterns.some(p => key.includes(p))) {
        this.memory.delete(key);
      }
    }

    logger.debug(`Invalidated cache for patterns: ${patterns.join(', ')}`);
  }

  invalidateByTags(tags: string[]): void {
    for (const [key, value] of this.memory.entries()) {
      if (value.tags && value.tags.some(tag => tags.includes(tag))) {
        this.memory.delete(key);
      }
    }
    
    logger.debug(`Invalidated cache for tags: ${tags.join(', ')}`);
  }

  async clear(): Promise<void> {
    this.memory.clear();

    if (this.disk) {
      await this.disk.read();
      this.disk.data = {};
      await this.disk.write();
    }

    logger.info('Cache cleared');
  }

  getStats() {
    return {
      size: this.memory.size,
      maxSize: this.memory.max,
      memoryUsage: this.memory.calculatedSize,
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    if (entry.ttl === Infinity) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private estimateSize(value: CacheEntry): number {
    try {
      return JSON.stringify(value.data).length;
    } catch {
      return 1000; // Default size estimate
    }
  }
}

// Cache key generators
export const CACHE_KEYS = {
  status: (repoPath: string) => `status:${repoPath}`,
  branches: (repoPath: string) => `branches:${repoPath}`,
  commits: (repoPath: string, branch: string, limit: number) =>
    `commits:${repoPath}:${branch}:${limit}`,
  fileContent: (repoPath: string, commitSHA: string, filePath: string) =>
    `file:${repoPath}:${commitSHA}:${filePath}`,
  diff: (repoPath: string, filePath: string, staged: boolean) =>
    `diff:${repoPath}:${filePath}:${staged}`,
  tree: (repoPath: string, ref: string) => `tree:${repoPath}:${ref}`,
  remote: (repoPath: string) => `remote:${repoPath}`,
};
