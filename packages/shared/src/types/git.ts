export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size?: number;
  mode?: string;
  sha?: string;
  children?: FileNode[];
}

export interface BlameInfo {
  sha: string;
  author: string;
  date: Date;
  lineNumber: number;
  content: string;
}

export interface TagInfo {
  name: string;
  commit: string;
  message?: string;
  tagger?: string;
  date?: Date;
  type: 'lightweight' | 'annotated';
}

export interface StashEntry {
  index: number;
  message: string;
  branch: string;
  date: Date;
}

export type GitOperation = 
  | 'clone'
  | 'fetch'
  | 'pull'
  | 'push'
  | 'commit'
  | 'checkout'
  | 'branch:create'
  | 'branch:delete'
  | 'merge'
  | 'rebase'
  | 'reset'
  | 'stage'
  | 'unstage'
  | 'discard'
  | 'stash';

export interface OperationProgress {
  operation: GitOperation;
  stage: string;
  progress: number;
  total?: number;
  message?: string;
}
