import type {
  GitStatus,
  Commit,
  LogOptions,
  Branch,
  Diff,
  DiffOptions,
  FileNode,
  TagInfo,
  StashEntry,
} from '@forkweb/shared';

// Core Git service interface (can be implemented in Go later)
export interface IGitService {
  // Repository operations
  clone(url: string, path: string): Promise<void>;
  init(path: string): Promise<void>;
  
  // Status and info
  status(repoPath: string): Promise<GitStatus>;
  currentBranch(repoPath: string): Promise<string>;
  
  // Log and history
  log(repoPath: string, options?: LogOptions): Promise<Commit[]>;
  show(repoPath: string, commitSHA: string): Promise<Commit>;
  
  // Branch operations
  branches(repoPath: string): Promise<Branch[]>;
  createBranch(repoPath: string, name: string, startPoint?: string): Promise<void>;
  deleteBranch(repoPath: string, name: string, force?: boolean): Promise<void>;
  checkout(repoPath: string, branch: string): Promise<void>;
  
  // Staging and committing
  stage(repoPath: string, files: string[]): Promise<void>;
  unstage(repoPath: string, files: string[]): Promise<void>;
  commit(repoPath: string, message: string, options?: { amend?: boolean }): Promise<string>;
  
  // Diff operations
  diff(repoPath: string, options: DiffOptions): Promise<Diff[]>;
  
  // File operations
  tree(repoPath: string, ref?: string): Promise<FileNode[]>;
  readFile(repoPath: string, filePath: string, ref?: string): Promise<string>;
  
  // Remote operations
  fetch(repoPath: string, remote?: string): Promise<void>;
  pull(repoPath: string, options?: { remote?: string; branch?: string; rebase?: boolean }): Promise<void>;
  push(repoPath: string, options?: { remote?: string; branch?: string; force?: boolean }): Promise<void>;
  
  // Tags and stashes
  getTags(repoPath: string): Promise<TagInfo[]>;
  getStashes(repoPath: string): Promise<StashEntry[]>;
  
  // Utility
  isRepository(path: string): Promise<boolean>;
}
