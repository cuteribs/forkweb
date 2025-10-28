export interface AppConfig {
  server: ServerConfig;
  git: GitConfig;
  ui: UiConfig;
  repositories: RepositoriesConfig;
  cache: CacheConfig;
}

export interface ServerConfig {
  port: number;
  host: string;
  autoStart: boolean;
}

export interface GitConfig {
  defaultBranch: string;
  diffContext: number;
  maxCommits: number;
  fetchTimeout: number;
}

export interface UiConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  commitPageSize: number;
}

export interface RepositoriesConfig {
  recentLimit: number;
  autoDiscover: boolean;
  excludePaths: string[];
  watchChanges: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  maxSize: number;
  ttl: CacheTTLConfig;
  persistence: boolean;
}

export interface CacheTTLConfig {
  status: number;
  branches: number;
  commits: number;
  files: number;
}
