import simpleGit, { SimpleGit, LogResult, StatusResult, BranchSummary } from 'simple-git';
import { IGitService } from '../../core/interfaces/IGitService';
import type {
  GitStatus,
  Commit,
  LogOptions,
  Branch,
  Diff,
  DiffOptions,
  FileNode,
  FileChange,
} from '@forkweb/shared';
import { logger } from '../../utils/logger';
import path from 'path';

export class SimpleGitAdapter implements IGitService {
  private gitInstances: Map<string, SimpleGit> = new Map();

  private getGit(repoPath: string): SimpleGit {
    if (!this.gitInstances.has(repoPath)) {
      const git = simpleGit(repoPath);
      this.gitInstances.set(repoPath, git);
    }
    return this.gitInstances.get(repoPath)!;
  }

  async clone(url: string, targetPath: string): Promise<void> {
    await simpleGit().clone(url, targetPath);
    logger.info(`Cloned repository from ${url} to ${targetPath}`);
  }

  async init(repoPath: string): Promise<void> {
    await this.getGit(repoPath).init();
    logger.info(`Initialized repository at ${repoPath}`);
  }

  async status(repoPath: string): Promise<GitStatus> {
    const git = this.getGit(repoPath);
    const status: StatusResult = await git.status();

    const files: FileChange[] = [
      ...status.modified.map(file => this.toFileChange(file, 'modified', true, true)),
      ...status.created.map(file => this.toFileChange(file, 'added', false, true)),
      ...status.deleted.map(file => this.toFileChange(file, 'deleted', true, true)),
      ...status.renamed.map(file => this.toFileChange(file.to, 'renamed', true, true, file.from)),
    ];

    const staged = files.filter(f => f.staged);
    const unstaged = files.filter(f => f.workingDir && !f.staged);

    return {
      current: status.current || '',
      tracking: status.tracking || undefined,
      ahead: status.ahead,
      behind: status.behind,
      files,
      staged,
      unstaged,
      untracked: status.not_added,
      conflicted: status.conflicted,
    };
  }

  async currentBranch(repoPath: string): Promise<string> {
    const status = await this.getGit(repoPath).status();
    return status.current || '';
  }

  async log(repoPath: string, options: LogOptions = {}): Promise<Commit[]> {
    const git = this.getGit(repoPath);
    
    try {
      const logOptions: any = {
        maxCount: options.maxCount || 1000,
        format: {
          hash: '%H',
          parents: '%P',
          date: '%ai',
          message: '%s',
          body: '%b',
          author_name: '%an',
          author_email: '%ae',
          refs: '%D',
        },
      };

      // Handle branch parameter - if provided, show commits from that branch only
      // If not provided, show commits from all branches
      if (options.branch) {
        logOptions.from = options.branch;
      } else {
        // Show commits from all branches
        logOptions['--all'] = null;
      }

      // Handle pagination with skip (only if greater than 0)
      if (options.skip && options.skip > 0) {
        logOptions.skip = options.skip;
      }

      // Handle file path filtering
      if (options.path) {
        logOptions.file = options.path;
      }

      const log: LogResult = await git.log(logOptions);

      return log.all.map((commit: any) => ({
        sha: commit.hash,
        message: commit.message,
        author: {
          name: commit.author_name,
          email: commit.author_email,
          date: new Date(commit.date),
        },
        committer: {
          name: commit.author_name,
          email: commit.author_email,
        },
        date: new Date(commit.date),
        parents: commit.parents ? commit.parents.split(' ').filter((p: string) => p) : [],
        branches: commit.refs ? commit.refs.split(', ')
          .filter((ref: string) => !ref.startsWith('tag: '))
          .map((ref: string) => {
            // Remove "HEAD -> " prefix but keep the branch name
            if (ref.startsWith('HEAD -> ')) {
              return ref.replace('HEAD -> ', '');
            }
            // Skip origin/HEAD
            if (ref === 'origin/HEAD' || ref.includes('origin/HEAD ->')) {
              return null;
            }
            // Keep remote branches with format "origin/branch-name"
            // Filter out refs like "refs/remotes/origin/branch-name" format
            if (ref.includes('origin/') || ref.includes('upstream/')) {
              return ref;
            }
            // Keep local branches (no slash in name)
            if (!ref.includes('/')) {
              return ref;
            }
            // Skip other refs
            return null;
          })
          .filter((ref: string | null) => ref !== null) : [],
      }));
    } catch (error: any) {
      // Handle empty repository or no commits case
      if (error.message?.includes('does not have any commits yet') ||
          error.message?.includes('unknown revision') ||
          error.message?.includes('ambiguous argument')) {
        logger.warn(`No commits found in ${repoPath}: ${error.message}`);
        return [];
      }
      throw error;
    }
  }

  async show(repoPath: string, commitSHA: string): Promise<Commit> {
    const git = this.getGit(repoPath);
    const result = await git.show([commitSHA, '--format=%H%n%an%n%ae%n%at%n%s%n%b']);
    
    const lines = result.split('\n');
    return {
      sha: lines[0],
      message: lines[4] + (lines[5] ? '\n' + lines[5] : ''),
      author: {
        name: lines[1],
        email: lines[2],
        date: new Date(parseInt(lines[3]) * 1000),
      },
      committer: {
        name: lines[1],
        email: lines[2],
      },
      date: new Date(parseInt(lines[3]) * 1000),
      parents: [],
    };
  }

  async branches(repoPath: string): Promise<Branch[]> {
    const git = this.getGit(repoPath);
    const summary: BranchSummary = await git.branch(['-a', '-vv']);

    const branches: Branch[] = [];
    
    for (const [name, branch] of Object.entries(summary.branches)) {
      const isRemote = name.startsWith('remotes/');
      const cleanName = isRemote ? name.replace('remotes/', '') : name;
      
      branches.push({
        name: cleanName,
        type: isRemote ? 'remote' : 'local',
        current: branch.current,
        commit: branch.commit,
      });
    }

    return branches;
  }

  async createBranch(repoPath: string, name: string, startPoint?: string): Promise<void> {
    const git = this.getGit(repoPath);
    if (startPoint) {
      await git.checkoutBranch(name, startPoint);
    } else {
      await git.checkoutLocalBranch(name);
    }
    logger.info(`Created branch ${name} in ${repoPath}`);
  }

  async deleteBranch(repoPath: string, name: string, force?: boolean): Promise<void> {
    const git = this.getGit(repoPath);
    await git.deleteLocalBranch(name, force);
    logger.info(`Deleted branch ${name} in ${repoPath}`);
  }

  async checkout(repoPath: string, branch: string): Promise<void> {
    const git = this.getGit(repoPath);
    await git.checkout(branch);
    logger.info(`Checked out ${branch} in ${repoPath}`);
  }

  async stage(repoPath: string, files: string[]): Promise<void> {
    const git = this.getGit(repoPath);
    await git.add(files);
    logger.info(`Staged ${files.length} files in ${repoPath}`);
  }

  async unstage(repoPath: string, files: string[]): Promise<void> {
    const git = this.getGit(repoPath);
    await git.reset(['HEAD', '--', ...files]);
    logger.info(`Unstaged ${files.length} files in ${repoPath}`);
  }

  async commit(repoPath: string, message: string, options?: { amend?: boolean }): Promise<string> {
    const git = this.getGit(repoPath);
    const result = await git.commit(message, undefined, options?.amend ? { '--amend': null } : {});
    logger.info(`Created commit ${result.commit} in ${repoPath}`);
    return result.commit;
  }

  async diff(repoPath: string, options: DiffOptions): Promise<Diff[]> {
    const git = this.getGit(repoPath);
    const args: string[] = [];

    if (options.staged) args.push('--cached');
    if (options.context) args.push(`-U${options.context}`);
    if (options.commitA) args.push(options.commitA);
    if (options.commitB) args.push(options.commitB);
    if (options.path) args.push('--', options.path);

    await git.diff(args);
    
    // Parse diff result (simplified)
    return [{
      path: options.path || '',
      status: 'modified',
      additions: 0,
      deletions: 0,
      hunks: [],
    }];
  }

  async tree(repoPath: string, ref: string = 'HEAD'): Promise<FileNode[]> {
    const git = this.getGit(repoPath);
    const result = await git.raw(['ls-tree', '-r', '--name-only', ref]);
    
    const files = result.split('\n').filter(Boolean);
    return files.map(filePath => ({
      path: filePath,
      name: path.basename(filePath),
      type: 'file' as const,
    }));
  }

  async readFile(repoPath: string, filePath: string, ref: string = 'HEAD'): Promise<string> {
    const git = this.getGit(repoPath);
    return await git.show([`${ref}:${filePath}`]);
  }

  async fetch(repoPath: string, remote: string = 'origin'): Promise<void> {
    const git = this.getGit(repoPath);
    await git.fetch(remote);
    logger.info(`Fetched from ${remote} in ${repoPath}`);
  }

  async pull(repoPath: string, options?: { remote?: string; branch?: string; rebase?: boolean }): Promise<void> {
    const git = this.getGit(repoPath);
    const pullOptions: any = {};
    if (options?.rebase) pullOptions['--rebase'] = null;
    
    await git.pull(options?.remote, options?.branch, pullOptions);
    logger.info(`Pulled changes in ${repoPath}`);
  }

  async push(repoPath: string, options?: { remote?: string; branch?: string; force?: boolean }): Promise<void> {
    const git = this.getGit(repoPath);
    const pushOptions: any = {};
    if (options?.force) pushOptions['--force'] = null;
    
    await git.push(options?.remote, options?.branch, pushOptions);
    logger.info(`Pushed changes in ${repoPath}`);
  }

  async isRepository(repoPath: string): Promise<boolean> {
    try {
      const git = this.getGit(repoPath);
      await git.status();
      return true;
    } catch {
      return false;
    }
  }

  private toFileChange(
    path: string,
    status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied',
    workingDir: boolean,
    staged: boolean,
    oldPath?: string
  ): FileChange {
    return {
      path,
      oldPath,
      status,
      staged,
      workingDir,
    };
  }
}
