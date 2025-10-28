import { FileStatus } from './commit';

export interface FileChange {
  path: string;
  oldPath?: string; // For renames
  status: FileStatus;
  staged: boolean;
  workingDir: boolean;
  diff?: string;
  additions?: number;
  deletions?: number;
}

export interface GitStatus {
  current: string;
  tracking?: string;
  ahead: number;
  behind: number;
  files: FileChange[];
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
  conflicted: string[];
}

export interface DiffOptions {
  path?: string;
  staged?: boolean;
  commitA?: string;
  commitB?: string;
  context?: number;
}

export interface Diff {
  path: string;
  oldPath?: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}
