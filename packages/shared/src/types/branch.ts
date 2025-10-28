export interface Branch {
  name: string;
  type: 'local' | 'remote';
  current: boolean;
  commit: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
}

export interface BranchList {
  current: string;
  all: Branch[];
  local: Branch[];
  remote: Branch[];
}
