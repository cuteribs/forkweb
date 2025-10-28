# Git Web UI - Architecture Design

## Overview
A lightweight, fast web-based Git client with a Vue.js frontend and Node.js backend, designed to browse repositories, branches, commits, and changes while performing Git operations through a system tray application.

## Technology Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **UI Components**: Custom components with optional lightweight library (e.g., Headless UI)
- **Styling**: TailwindCSS or custom CSS modules

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Fastify (high performance, TypeScript-friendly)
- **Git Operations**: simple-git (full Git compatibility)
- **Cache**: lru-cache (in-memory) + lowdb (optional persistence)
- **System Tray**: Electron (full-featured desktop integration)
- **WebSocket**: Socket.io (real-time updates)
- **File Watching**: chokidar (automatic cache invalidation)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        System Tray                           │
│                    (Background Process)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ├─ Start/Stop Server
                      ├─ Open Web UI
                      ├─ Settings
                      └─ Exit
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      Web Server                              │
│                    (HTTP + WebSocket)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────────┐ ┌─▼──────────┐
│   Frontend   │ │    API     │ │  WebSocket │
│   (Static)   │ │  Endpoints │ │   Events   │
└──────────────┘ └────┬───────┘ └────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────────┐ ┌─▼──────────┐
│     Git      │ │    File    │ │   Config   │
│   Service    │ │  Service   │ │  Service   │
└──────────────┘ └────────────┘ └────────────┘
```

## Directory Structure

```
forkweb/
├── packages/
│   ├── frontend/                 # Vue.js frontend application
│   │   ├── src/
│   │   │   ├── api/             # API client layer
│   │   │   ├── components/      # Vue components
│   │   │   ├── composables/     # Composition API composables
│   │   │   ├── layouts/         # Layout components
│   │   │   ├── router/          # Vue Router configuration
│   │   │   ├── stores/          # Pinia stores
│   │   │   ├── types/           # TypeScript types/interfaces
│   │   │   ├── utils/           # Utility functions
│   │   │   ├── views/           # Page components
│   │   │   ├── App.vue
│   │   │   └── main.ts
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── backend/                  # Node.js backend application
│   │   ├── src/
│   │   │   ├── api/             # API routes and controllers
│   │   │   │   ├── controllers/
│   │   │   │   ├── routes/
│   │   │   │   └── middleware/
│   │   │   ├── core/            # Core abstractions (for Go migration)
│   │   │   │   ├── interfaces/  # Abstract interfaces
│   │   │   │   ├── types/       # Shared types
│   │   │   │   └── contracts/   # Service contracts
│   │   │   ├── services/        # Business logic layer
│   │   │   │   ├── git/         # Git operations service
│   │   │   │   ├── repository/  # Repository management
│   │   │   │   ├── file/        # File system operations
│   │   │   │   └── config/      # Configuration management
│   │   │   ├── infrastructure/  # Infrastructure layer
│   │   │   │   ├── git/         # Git implementation (simple-git)
│   │   │   │   ├── storage/     # Data storage
│   │   │   │   ├── cache/       # Caching layer (lru-cache + lowdb)
│   │   │   │   └── watchers/    # File system watchers (chokidar)
│   │   │   ├── tray/            # System tray application
│   │   │   ├── websocket/       # WebSocket handlers
│   │   │   ├── utils/           # Utility functions
│   │   │   ├── config/          # Configuration
│   │   │   └── server.ts        # Main server entry
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                   # Shared types and constants
│       ├── src/
│       │   ├── types/           # Shared TypeScript types
│       │   ├── constants/       # Shared constants
│       │   └── utils/           # Shared utilities
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                         # Documentation
├── scripts/                      # Build and deployment scripts
├── package.json                  # Root package.json (monorepo)
├── pnpm-workspace.yaml          # PNPM workspace configuration
├── turbo.json                   # Turborepo configuration (optional)
└── README.md
```

## Core Components

### 1. Frontend Application

#### Views/Pages
- **Repository List** (`/`)
  - Browse local repositories
  - Add/remove repositories
  - Search and filter

- **Repository View** (`/repo/:id`)
  - Branch selector
  - Current status
  - Quick actions

- **Commit History** (`/repo/:id/commits`)
  - Commit list with graph
  - Filter by branch/author/date
  - Commit details

- **Changes View** (`/repo/:id/changes`)
  - Working directory changes
  - Staged changes
  - Diff viewer
  - Stage/unstage/discard actions

- **Branch Management** (`/repo/:id/branches`)
  - Local branches
  - Remote branches
  - Create/delete/merge branches

- **File Browser** (`/repo/:id/files`)
  - Repository file tree
  - File content viewer
  - Blame view

#### Key Components
- `DiffViewer` - Side-by-side or unified diff display
- `CommitGraph` - Visual commit history graph
- `FileTree` - Hierarchical file browser
- `ChangesList` - Working directory and staged changes
- `BranchSelector` - Branch switching dropdown
- `ActionBar` - Quick action buttons

#### State Management (Pinia Stores)
- `useRepositoryStore` - Repository list and selection
- `useCommitStore` - Commit history and details
- `useChangesStore` - Working directory and staging area
- `useBranchStore` - Branch information
- `useConfigStore` - Application configuration

### 2. Backend Application

#### API Layer (Abstraction for Go Migration)

```typescript
// Core interface that can be implemented in Go
interface IGitService {
  clone(url: string, path: string): Promise<void>;
  status(repoPath: string): Promise<GitStatus>;
  log(repoPath: string, options: LogOptions): Promise<Commit[]>;
  diff(repoPath: string, options: DiffOptions): Promise<Diff>;
  checkout(repoPath: string, branch: string): Promise<void>;
  commit(repoPath: string, message: string): Promise<void>;
  push(repoPath: string, remote: string, branch: string): Promise<void>;
  pull(repoPath: string): Promise<void>;
  // ... more operations
}

interface IRepositoryService {
  list(): Promise<Repository[]>;
  add(path: string): Promise<Repository>;
  remove(id: string): Promise<void>;
  get(id: string): Promise<Repository>;
}

interface IFileService {
  read(repoPath: string, filePath: string): Promise<string>;
  tree(repoPath: string, ref?: string): Promise<FileNode[]>;
}
```

#### API Endpoints

**Repositories**
- `GET /api/repositories` - List all repositories
- `POST /api/repositories` - Add repository
- `GET /api/repositories/:id` - Get repository details
- `DELETE /api/repositories/:id` - Remove repository

**Commits**
- `GET /api/repositories/:id/commits` - Get commit history
- `GET /api/repositories/:id/commits/:sha` - Get commit details
- `GET /api/repositories/:id/commits/:sha/diff` - Get commit diff

**Changes**
- `GET /api/repositories/:id/status` - Get working directory status
- `POST /api/repositories/:id/stage` - Stage files
- `POST /api/repositories/:id/unstage` - Unstage files
- `POST /api/repositories/:id/discard` - Discard changes
- `POST /api/repositories/:id/commit` - Create commit

**Branches**
- `GET /api/repositories/:id/branches` - List branches
- `POST /api/repositories/:id/branches` - Create branch
- `DELETE /api/repositories/:id/branches/:name` - Delete branch
- `POST /api/repositories/:id/checkout` - Checkout branch
- `POST /api/repositories/:id/merge` - Merge branches

**Files**
- `GET /api/repositories/:id/tree` - Get file tree
- `GET /api/repositories/:id/blob/:path` - Get file content
- `GET /api/repositories/:id/blame/:path` - Get file blame

**Actions**
- `POST /api/repositories/:id/pull` - Pull changes
- `POST /api/repositories/:id/push` - Push changes
- `POST /api/repositories/:id/fetch` - Fetch from remote

#### WebSocket Events

**Client → Server**
- `subscribe:repository` - Subscribe to repository updates
- `unsubscribe:repository` - Unsubscribe from updates

**Server → Client**
- `repository:changed` - Repository state changed
- `operation:progress` - Long-running operation progress
- `operation:complete` - Operation completed
- `operation:error` - Operation error

### 3. System Tray Application

#### Features
- Start/stop web server
- Open web UI in browser
- Configure port and settings
- Auto-start on system boot
- Notification support

#### Implementation Options

**Option A: Electron (Recommended for Node.js)**
```typescript
import { app, Tray, Menu, BrowserWindow } from 'electron';

class TrayApplication {
  private tray: Tray;
  private server: ServerInstance;
  
  initialize() {
    // Create tray icon
    // Start server
    // Create context menu
  }
}
```

**Option B: node-systray (Lighter)**
```typescript
import SysTray from 'systray2';

class TrayApplication {
  private systray: SysTray;
  
  initialize() {
    // Simpler but less features
  }
}
```

## Caching Strategy

### Overview
Implement a hybrid caching approach using **lru-cache** (in-memory) with optional **lowdb** (persistence) for optimal performance and user experience.

### Cache Architecture

```typescript
import { LRUCache } from 'lru-cache';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import chokidar from 'chokidar';

class GitCacheService {
  // Primary: Fast in-memory LRU cache
  private memory: LRUCache<string, CacheEntry>;
  
  // Secondary: Optional persistent cache for expensive data
  private disk?: Low<CacheData>;
  
  // Cache invalidation tracking
  private watchers: Map<string, chokidar.FSWatcher>;
  
  constructor(options: CacheOptions) {
    this.memory = new LRUCache({
      max: 500,                          // Max 500 cache entries
      maxSize: 100 * 1024 * 1024,       // 100MB memory limit
      sizeCalculation: (value) => this.estimateSize(value),
      ttl: 30000,                        // 30s default TTL
      updateAgeOnGet: true,              // LRU behavior
      ttlAutopurge: true                 // Auto cleanup expired entries
    });
    
    // Optional disk cache for commit history and file content
    if (options.enablePersistence) {
      this.disk = new Low(new JSONFile('.forkweb/cache.json'));
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Try memory first (fast path)
    const memValue = this.memory.get(key);
    if (memValue) {
      return memValue.data as T;
    }
    
    // Try disk cache if available (slower path, but survives restarts)
    if (this.disk) {
      await this.disk.read();
      const diskValue = this.disk.data[key];
      if (diskValue && !this.isExpired(diskValue)) {
        // Promote to memory cache
        this.memory.set(key, diskValue);
        return diskValue.data as T;
      }
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    const entry: CacheEntry = {
      data: value,
      timestamp: Date.now(),
      ttl: options?.ttl || 30000,
      tags: options?.tags || []
    };
    
    // Always store in memory cache
    this.memory.set(key, entry, { ttl: entry.ttl });
    
    // Optionally persist expensive/immutable data
    if (options?.persist && this.disk) {
      await this.disk.read();
      this.disk.data[key] = entry;
      await this.disk.write();
    }
  }
  
  // Invalidate cache by pattern or tags
  invalidate(pattern: string | string[]): void {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    
    for (const key of this.memory.keys()) {
      if (patterns.some(p => key.includes(p))) {
        this.memory.delete(key);
      }
    }
  }
}
```

### Cache Strategies by Data Type

| Data Type | Memory Cache | Disk Cache | TTL | Invalidation |
|-----------|--------------|------------|-----|--------------|
| **Git Status** | ✅ Yes | ❌ No | 3s | After commit, stage, unstage, checkout |
| **Branch List** | ✅ Yes | ❌ No | 15s | After branch ops, fetch, pull |
| **Commit History** | ✅ Yes | ✅ Yes | 5m | After commit, pull, rebase |
| **File Content (historical)** | ✅ Yes (LRU) | ✅ Yes | ∞ | Never (immutable) |
| **File Content (working)** | ✅ Yes | ❌ No | 2s | On file system change |
| **Diff Results** | ✅ Yes | ❌ No | 10s | When files change |
| **File Tree** | ✅ Yes | ❌ No | 30s | After commit, checkout |
| **Remote Info** | ✅ Yes | ❌ No | 60s | After fetch, push |

### File System Watching for Auto-Invalidation

```typescript
class FileSystemWatcher {
  private watchers: Map<string, chokidar.FSWatcher>;
  
  watchRepository(repoPath: string, cache: GitCacheService): void {
    const watcher = chokidar.watch(repoPath, {
      ignored: /(^|[\/\\])\../, // Ignore .git directory
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });
    
    // Working directory changes
    watcher.on('change', (path) => {
      cache.invalidate([`status:${repoPath}`, `tree:${repoPath}`]);
    });
    
    // Watch .git/refs for branch changes
    const gitWatcher = chokidar.watch(`${repoPath}/.git/refs/**`, {
      ignoreInitial: true
    });
    
    gitWatcher.on('all', () => {
      cache.invalidate([`branches:${repoPath}`, `status:${repoPath}`]);
    });
    
    this.watchers.set(repoPath, watcher);
  }
  
  unwatchRepository(repoPath: string): void {
    const watcher = this.watchers.get(repoPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(repoPath);
    }
  }
}
```

### Cache Invalidation Rules

```typescript
class CacheInvalidator {
  private static readonly INVALIDATION_MAP: Record<string, string[]> = {
    'commit': ['status', 'commits', 'tree', 'branches'],
    'checkout': ['status', 'branches', 'tree', 'currentBranch'],
    'stage': ['status'],
    'unstage': ['status'],
    'pull': ['commits', 'status', 'branches', 'remote'],
    'fetch': ['branches', 'remote', 'commits'],
    'push': ['remote'],
    'branch:create': ['branches'],
    'branch:delete': ['branches'],
    'reset': ['status', 'commits', 'tree'],
    'rebase': ['commits', 'status']
  };
  
  async invalidateAfter(
    operation: GitOperation,
    repoPath: string,
    cache: GitCacheService
  ): Promise<void> {
    const toInvalidate = CacheInvalidator.INVALIDATION_MAP[operation] || [];
    
    const patterns = toInvalidate.map(type => `${type}:${repoPath}`);
    cache.invalidate(patterns);
    
    // Emit event for real-time UI updates
    this.notifyClients(repoPath, operation);
  }
}
```

### Cache Key Patterns

```typescript
// Consistent cache key naming convention
const CACHE_KEYS = {
  status: (repoPath: string) => `status:${repoPath}`,
  branches: (repoPath: string) => `branches:${repoPath}`,
  commits: (repoPath: string, branch: string, limit: number) => 
    `commits:${repoPath}:${branch}:${limit}`,
  fileContent: (repoPath: string, commitSHA: string, filePath: string) => 
    `file:${repoPath}:${commitSHA}:${filePath}`,
  diff: (repoPath: string, filePath: string, staged: boolean) => 
    `diff:${repoPath}:${filePath}:${staged}`,
  tree: (repoPath: string, ref: string) => 
    `tree:${repoPath}:${ref}`,
  remote: (repoPath: string) => 
    `remote:${repoPath}`
} as const;
```

### Benefits

1. **⚡ Performance**
   - Sub-millisecond cache hits (in-memory)
   - LRU eviction prevents memory bloat
   - Optional persistence for expensive data

2. **🎯 Smart Invalidation**
   - File system watching for automatic updates
   - Operation-based invalidation
   - Tag-based bulk invalidation

3. **🪶 Lightweight**
   - Zero external dependencies (Redis, etc.)
   - Works offline
   - Simple to deploy

4. **🔄 Consistent State**
   - Centralized cache service
   - Event-driven invalidation
   - WebSocket notifications for UI updates

## Design Patterns for Go Migration

### 1. Repository Pattern
```typescript
// Abstract repository interface
interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implementation
class RepositoryImpl<T> implements IRepository<T> {
  // Node.js specific implementation
}
```

### 2. Service Layer Pattern
```typescript
// Services depend on interfaces, not implementations
class GitService implements IGitService {
  constructor(
    private gitAdapter: IGitAdapter,
    private logger: ILogger
  ) {}
}
```

### 3. Adapter Pattern
```typescript
// Git adapter interface
interface IGitAdapter {
  executeCommand(cmd: string, args: string[]): Promise<string>;
}

// Node.js implementation (simple-git)
class SimpleGitAdapter implements IGitAdapter {
  // Uses simple-git library
}

// Future Go implementation would implement same interface
```

### 4. Dependency Injection
```typescript
// Container for dependency injection
class Container {
  register<T>(token: symbol, factory: () => T): void;
  resolve<T>(token: symbol): T;
}

// Usage
const container = new Container();
container.register(GIT_SERVICE, () => new GitService(
  container.resolve(GIT_ADAPTER),
  container.resolve(LOGGER)
));
```

## Data Models

### Repository
```typescript
interface Repository {
  id: string;
  name: string;
  path: string;
  currentBranch: string;
  remotes: Remote[];
  lastUpdated: Date;
  tags: string[];
}
```

### Commit
```typescript
interface Commit {
  sha: string;
  message: string;
  author: Author;
  date: Date;
  parents: string[];
  branches: string[];
  tags: string[];
}
```

### Change
```typescript
interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  staged: boolean;
  diff?: string;
  oldPath?: string; // For renames
}
```

### Branch
```typescript
interface Branch {
  name: string;
  type: 'local' | 'remote';
  current: boolean;
  commit: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
}
```

## Performance Optimizations

### Frontend
1. **Virtual Scrolling** - For large commit lists and file trees (use `@vueuse/core` virtual list)
2. **Code Splitting** - Lazy load routes and heavy components with `defineAsyncComponent`
3. **Debouncing** - Search and filter operations (300ms debounce)
4. **Pinia Store Caching** - Store frequently accessed data with computed getters
5. **Incremental Loading** - Load commits/changes in batches (50-100 per page)
6. **Request Deduplication** - Prevent duplicate API calls for same data

### Backend
1. **LRU Cache (lru-cache)** - In-memory caching with automatic eviction (primary optimization)
2. **Persistent Cache (lowdb)** - Optional disk cache for expensive operations (commit history)
3. **File System Watching (chokidar)** - Auto-invalidate cache on file changes
4. **Stream Processing** - Stream large diffs instead of loading in memory
5. **Request Deduplication** - Single git operation for multiple simultaneous requests
6. **Background Refresh** - Update cache during idle time
7. **Worker Threads** - Offload heavy git operations (optional for large repos)
8. **Lazy Loading** - Load file contents on demand

## Security Considerations

1. **Path Traversal Protection** - Validate all file paths
2. **Command Injection Prevention** - Sanitize git command parameters
3. **Local-only Access** - Bind to localhost by default
4. **Authentication** - Optional token-based auth for remote access
5. **CORS Configuration** - Restrict cross-origin requests
6. **Rate Limiting** - Prevent API abuse

## Configuration

### Application Settings
```typescript
interface AppConfig {
  server: {
    port: number;
    host: string;
    autoStart: boolean;
  };
  git: {
    defaultBranch: string;
    diffContext: number;
    maxCommits: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    dateFormat: string;
  };
  repositories: {
    recentLimit: number;
    autoDiscover: boolean;
    excludePaths: string[];
  };
}
```

## Development Workflow

### Setup
```bash
# Install dependencies
pnpm install

# Start backend in dev mode
pnpm --filter backend dev

# Start frontend in dev mode
pnpm --filter frontend dev
```

### Build
```bash
# Build all packages
pnpm build

# Build for production
pnpm build:prod
```

### Testing
```bash
# Run all tests
pnpm test

# Run backend tests
pnpm --filter backend test

# Run frontend tests
pnpm --filter frontend test
```

## Deployment

### Packaging
- **Windows**: Use electron-builder or pkg to create executable
- **macOS**: Create .app bundle
- **Linux**: Create AppImage or .deb package

### Distribution
- Auto-updater support (electron-updater)
- GitHub Releases
- Installation via package managers (brew, chocolatey, apt)

## Future Enhancements

1. **Multi-tab Support** - Work with multiple repositories simultaneously
2. **Git LFS Support** - Handle large files
3. **Submodule Management** - Visual submodule operations
4. **Conflict Resolution** - Visual merge conflict resolver
5. **Stash Management** - Save and apply stashes
6. **Interactive Rebase** - Visual rebase interface
7. **Search** - Full-text search across commits and files
8. **Plugins** - Extension system for custom functionality
9. **Cloud Sync** - Sync settings across devices
10. **Collaboration** - Real-time collaboration features

## Migration Path to Go

When ready to migrate backend to Go:

1. **Implement interfaces in Go** - Use the same interface contracts
2. **HTTP API compatibility** - Maintain same endpoints and responses
3. **Gradual migration** - Replace services one by one
4. **Shared types** - Use JSON schema or Protocol Buffers
5. **Testing** - Comprehensive integration tests ensure compatibility

```go
// Go implementation of IGitService
type GitService struct {
    adapter GitAdapter
    logger  Logger
}

func (s *GitService) Status(repoPath string) (*GitStatus, error) {
    // Implementation using go-git library
}
```

## Conclusion

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Easy migration path to Go
- ✅ Fast and lightweight frontend
- ✅ Scalable backend structure
- ✅ System tray integration
- ✅ Modern development experience
- ✅ Extensible design

The key is maintaining clear interfaces and abstractions that can be implemented in different languages while keeping the same API contracts.
