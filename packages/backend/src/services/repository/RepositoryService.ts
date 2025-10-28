import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { IRepositoryService } from '../../core/interfaces/IRepositoryService';
import { IGitService } from '../../core/interfaces/IGitService';
import type { Repository } from '@forkweb/shared';
import { generateId, getRepoNameFromPath, normalizeRepoPath } from '@forkweb/shared';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs/promises';

interface RepositoryData {
  repositories: Repository[];
}

export class RepositoryService implements IRepositoryService {
  private db!: Low<RepositoryData>;
  private dbPath: string;
  private gitService: IGitService;

  constructor(gitService: IGitService) {
    this.gitService = gitService;
    this.dbPath = path.join(process.cwd(), '.forkweb', 'repositories.json');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    
    this.db = new Low(new JSONFile<RepositoryData>(this.dbPath), { repositories: [] });
    await this.db.read();
    this.db.data ||= { repositories: [] };
    
    logger.info('Repository service initialized');
  }

  async list(): Promise<Repository[]> {
    await this.db.read();
    return this.db.data.repositories;
  }

  async get(id: string): Promise<Repository | null> {
    await this.db.read();
    return this.db.data.repositories.find(repo => repo.id === id) || null;
  }

  async add(repoPath: string): Promise<Repository> {
    const normalized = normalizeRepoPath(repoPath);
    
    // Check if repository is valid
    const isValid = await this.gitService.isRepository(normalized);
    if (!isValid) {
      throw new Error(`Not a valid Git repository: ${repoPath}`);
    }

    // Check if already exists
    await this.db.read();
    const existing = this.db.data.repositories.find(r => r.path === normalized);
    if (existing) {
      return existing;
    }

    // Get current branch
    const currentBranch = await this.gitService.currentBranch(normalized);

    // Create repository entry
    const repository: Repository = {
      id: generateId(),
      name: getRepoNameFromPath(normalized),
      path: normalized,
      currentBranch,
      remotes: [],
      lastUpdated: new Date(),
    };

    this.db.data.repositories.push(repository);
    await this.db.write();

    logger.info(`Added repository: ${repository.name} (${repository.id})`);
    return repository;
  }

  async remove(id: string): Promise<void> {
    await this.db.read();
    const index = this.db.data.repositories.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new Error(`Repository not found: ${id}`);
    }

    const removed = this.db.data.repositories.splice(index, 1)[0];
    await this.db.write();

    logger.info(`Removed repository: ${removed.name} (${id})`);
  }

  async update(id: string, data: Partial<Repository>): Promise<Repository> {
    await this.db.read();
    const repo = this.db.data.repositories.find(r => r.id === id);
    
    if (!repo) {
      throw new Error(`Repository not found: ${id}`);
    }

    Object.assign(repo, data);
    repo.lastUpdated = new Date();
    await this.db.write();

    logger.info(`Updated repository: ${repo.name} (${id})`);
    return repo;
  }

  async refresh(id: string): Promise<Repository> {
    const repo = await this.get(id);
    if (!repo) {
      throw new Error(`Repository not found: ${id}`);
    }

    // Refresh current branch
    const currentBranch = await this.gitService.currentBranch(repo.path);
    
    return await this.update(id, { currentBranch });
  }

  async exists(id: string): Promise<boolean> {
    await this.db.read();
    return this.db.data.repositories.some(r => r.id === id);
  }
}
