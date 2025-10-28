export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface StageFilesRequest {
  files: string[];
}

export interface UnstageFilesRequest {
  files: string[];
}

export interface DiscardChangesRequest {
  files: string[];
}

export interface CreateCommitRequest {
  message: string;
  files?: string[];
  amend?: boolean;
}

export interface CheckoutRequest {
  branch?: string;
  commit?: string;
  createBranch?: boolean;
}

export interface CreateBranchRequest {
  name: string;
  startPoint?: string;
  checkout?: boolean;
}

export interface DeleteBranchRequest {
  name: string;
  force?: boolean;
}

export interface MergeRequest {
  branch: string;
  noFastForward?: boolean;
}

export interface PushRequest {
  remote?: string;
  branch?: string;
  force?: boolean;
  setUpstream?: boolean;
}

export interface PullRequest {
  remote?: string;
  branch?: string;
  rebase?: boolean;
}
