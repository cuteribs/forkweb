export interface Repository {
  id: string;
  name: string;
  path: string;
  currentBranch: string;
  remotes: Remote[];
  lastUpdated: Date;
  tags?: string[];
  isBare?: boolean;
}

export interface Remote {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

export interface RepositoryStatus {
  ahead: number;
  behind: number;
  hasChanges: boolean;
  changedFiles: number;
  stagedFiles: number;
}
