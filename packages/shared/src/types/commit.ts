export interface Commit {
  sha: string;
  message: string;
  author: Author;
  committer: Author;
  date: Date;
  parents: string[];
  branches: string[];
  tags: string[];
  isStash: boolean;
}

export interface Author {
  name: string;
  email: string;
  date?: Date;
}

export interface CommitDetails extends Commit {
  stats: CommitStats;
  files: CommitFile[];
}

export interface CommitStats {
  additions: number;
  deletions: number;
  total: number;
  filesChanged: number;
}

export interface CommitFile {
  path: string;
  oldPath?: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  diff?: string;
}

export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';

export interface LogOptions {
  branch?: string;
  maxCount?: number;
  skip?: number;
  author?: string;
  since?: Date;
  until?: Date;
  path?: string;
}
