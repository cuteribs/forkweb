# ForkWeb Implementation Guide

## ✅ Completed Components

### 1. Project Structure ✓
- Monorepo setup with pnpm workspaces
- Shared package for types and constants
- Backend package structure
- Frontend package structure (to be completed)

### 2. Shared Package ✓
**Location**: `packages/shared/`

**Completed Files**:
- `src/types/repository.ts` - Repository interfaces
- `src/types/commit.ts` - Commit and log interfaces
- `src/types/branch.ts` - Branch interfaces
- `src/types/change.ts` - File changes and diff interfaces
- `src/types/git.ts` - Git operations and utilities
- `src/types/api.ts` - API request/response types
- `src/types/config.ts` - Configuration interfaces
- `src/constants/index.ts` - Constants and enums
- `src/utils/index.ts` - Utility functions

### 3. Backend Core ✓
**Location**: `packages/backend/`

**Completed Files**:
- `src/server.ts` - Main server entry point
- `src/config/index.ts` - Configuration management
- `src/utils/logger.ts` - Pino logger setup

**Core Interfaces** (Go Migration Ready):
- `src/core/interfaces/IGitService.ts` - Git service interface
- `src/core/interfaces/IRepositoryService.ts` - Repository service interface

**Infrastructure Layer**:
- `src/infrastructure/cache/CacheService.ts` - **LRU cache + lowdb implementation** ⭐
- `src/infrastructure/watchers/FileSystemWatcher.ts` - **Chokidar file watching** ⭐
- `src/infrastructure/git/SimpleGitAdapter.ts` - simple-git wrapper

**Service Layer**:
- `src/services/git/GitService.ts` - Git service with caching
- `src/services/repository/RepositoryService.ts` - Repository management
- `src/services/index.ts` - Service initialization

## 🚧 To Be Implemented

### 4. Backend API Routes
**Location**: `packages/backend/src/api/`

**Files to Create**:
```
src/api/
├── routes/
│   ├── index.ts                    # Route registration
│   ├── repositories.ts             # Repository endpoints
│   ├── commits.ts                  # Commit endpoints
│   ├── branches.ts                 # Branch endpoints
│   ├── changes.ts                  # Changes/staging endpoints
│   └── files.ts                    # File operations endpoints
├── controllers/
│   ├── RepositoryController.ts
│   ├── CommitController.ts
│   ├── BranchController.ts
│   ├── ChangeController.ts
│   └── FileController.ts
└── middleware/
    ├── errorHandler.ts
    ├── validation.ts
    └── asyncHandler.ts
```

**Key Implementation Points**:
- Use Fastify route handlers
- Integrate with services
- Call `invalidator.invalidateAfter()` after write operations
- Return standardized `ApiResponse<T>` format

### 5. WebSocket Handlers
**Location**: `packages/backend/src/websocket/`

**Files to Create**:
```
src/websocket/
├── index.ts                        # WebSocket setup
└── handlers.ts                     # Event handlers
```

**Events to Implement**:
- `subscribe:repository` - Client subscribes to repo updates
- `unsubscribe:repository` - Client unsubscribes
- `repository:changed` - Broadcast changes
- `operation:progress` - Long-running operation progress
- `operation:complete` - Operation completed
- `operation:error` - Operation error

### 6. Frontend Application
**Location**: `packages/frontend/`

**Structure to Create**:
```
packages/frontend/
├── src/
│   ├── api/
│   │   ├── client.ts               # Axios instance
│   │   ├── repositories.ts         # Repository API calls
│   │   ├── commits.ts              # Commit API calls
│   │   ├── branches.ts             # Branch API calls
│   │   └── websocket.ts            # Socket.io client
│   ├── components/
│   │   ├── commit/
│   │   │   ├── CommitList.vue
│   │   │   ├── CommitGraph.vue
│   │   │   └── CommitDetails.vue
│   │   ├── diff/
│   │   │   ├── DiffViewer.vue
│   │   │   └── DiffLine.vue
│   │   ├── file/
│   │   │   ├── FileTree.vue
│   │   │   └── FileViewer.vue
│   │   ├── branch/
│   │   │   ├── BranchList.vue
│   │   │   └── BranchSelector.vue
│   │   └── common/
│   │       ├── ActionBar.vue
│   │       ├── SearchBar.vue
│   │       └── LoadingSpinner.vue
│   ├── stores/
│   │   ├── repository.ts           # Pinia store
│   │   ├── commit.ts
│   │   ├── branch.ts
│   │   ├── changes.ts
│   │   └── config.ts
│   ├── views/
│   │   ├── RepositoryList.vue
│   │   ├── RepositoryView.vue
│   │   ├── CommitHistory.vue
│   │   ├── ChangesView.vue
│   │   ├── BranchManagement.vue
│   │   └── FileExplorer.vue
│   ├── router/
│   │   └── index.ts
│   ├── composables/
│   │   ├── useRepository.ts
│   │   ├── useWebSocket.ts
│   │   └── usePolling.ts
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### 7. System Tray Application
**Location**: `packages/tray/` or `packages/backend/src/tray/`

**Option A: Electron (Recommended)**
```
packages/tray/
├── src/
│   ├── main.ts                     # Electron main process
│   ├── tray.ts                     # System tray manager
│   └── preload.ts                  # Preload script
├── package.json
└── electron-builder.json
```

**Features to Implement**:
- Start/stop server
- Open web UI in browser
- Settings panel
- Minimize to tray
- Auto-start option

## 📋 Implementation Order

### Phase 1: Complete Backend (Week 1-2)
1. ✅ Core interfaces and types
2. ✅ Cache service with LRU + lowdb
3. ✅ File system watcher
4. ✅ Git adapter and service
5. ✅ Repository service
6. ⏳ API routes and controllers
7. ⏳ WebSocket handlers
8. ⏳ Error handling middleware
9. ⏳ Request validation

### Phase 2: Frontend Foundation (Week 3)
1. Setup Vite + Vue 3 + TypeScript
2. Configure Tailwind CSS
3. Setup Vue Router
4. Setup Pinia stores
5. Create API client layer
6. Create WebSocket client

### Phase 3: Core UI Components (Week 4-5)
1. Repository list view
2. Commit history with virtual scrolling
3. Changes view with diff viewer
4. Branch management
5. File browser
6. Search and filters

### Phase 4: System Tray (Week 6)
1. Electron setup
2. Tray icon and menu
3. Server lifecycle management
4. Settings dialog
5. Auto-updater

### Phase 5: Polish & Testing (Week 7-8)
1. Error handling
2. Loading states
3. Notifications
4. Unit tests
5. Integration tests
6. Documentation
7. Build and packaging

## 🔧 Next Steps

### Immediate Tasks:

1. **Install Dependencies**
   ```bash
   cd c:\git\eric\forkweb
   pnpm install
   ```

2. **Build Shared Package**
   ```bash
   cd packages/shared
   pnpm build
   ```

3. **Implement API Routes**
   - Start with `repositories.ts` routes
   - Add controllers for each endpoint
   - Test with curl or Postman

4. **Implement WebSocket**
   - Setup Socket.io server
   - Add event handlers
   - Test with socket.io client

5. **Setup Frontend**
   ```bash
   cd packages/frontend
   pnpm create vite . --template vue-ts
   # Follow frontend setup guide
   ```

## 💡 Key Design Patterns Used

### 1. Repository Pattern
Services depend on interfaces, not implementations:
```typescript
class GitService implements IGitService {
  constructor(private adapter: IGitService) {}
}
```

### 2. Dependency Injection
All services registered in container:
```typescript
const services = await initializeServices();
app.decorate('services', services);
```

### 3. Caching Layer
Transparent caching in service layer:
```typescript
async status(repoPath: string): Promise<GitStatus> {
  const cached = await this.cache.get(key);
  if (cached) return cached;
  
  const result = await this.adapter.status(repoPath);
  await this.cache.set(key, result, { ttl: 3000 });
  return result;
}
```

### 4. Event-Driven Invalidation
File system changes trigger cache invalidation:
```typescript
watcher.on('change', () => {
  cache.invalidate(['status:', 'tree:']);
});
```

### 5. Interface-First Design
All services implement interfaces that can be ported to Go:
```typescript
// TypeScript
interface IGitService {
  status(repoPath: string): Promise<GitStatus>;
}

// Future Go equivalent
type GitService interface {
    Status(repoPath string) (*GitStatus, error)
}
```

## 🎯 Testing Strategy

### Backend Tests
```bash
# Unit tests
pnpm --filter backend test

# Integration tests
pnpm --filter backend test:integration

# Test files structure
tests/
├── unit/
│   ├── services/
│   ├── infrastructure/
│   └── utils/
└── integration/
    ├── api/
    └── websocket/
```

### Frontend Tests
```bash
# Component tests
pnpm --filter frontend test

# E2E tests (optional)
pnpm --filter frontend test:e2e
```

## 📦 Build & Deployment

### Development
```bash
# Start all in dev mode
pnpm dev

# Backend only
pnpm --filter backend dev

# Frontend only
pnpm --filter frontend dev
```

### Production Build
```bash
# Build all packages
pnpm build

# Package with Electron
pnpm --filter tray build
pnpm --filter tray package
```

### Distribution
- Windows: `.exe` installer with NSIS
- macOS: `.dmg` or `.app` bundle
- Linux: AppImage or `.deb`

## 🔐 Security Checklist

- [ ] Validate all file paths (no `..`)
- [ ] Sanitize Git command parameters
- [ ] Bind to localhost by default
- [ ] Implement rate limiting
- [ ] Add request size limits
- [ ] CORS configuration
- [ ] Input validation with Zod
- [ ] Error messages don't leak sensitive info

## 📚 Documentation

Files to create:
- [ ] API.md - API endpoint documentation
- [ ] CONTRIBUTING.md - Contribution guidelines
- [ ] DEPLOYMENT.md - Deployment instructions
- [ ] TROUBLESHOOTING.md - Common issues

## 🚀 Ready to Continue?

The foundation is solid. Next steps:
1. Implement API routes and controllers
2. Add WebSocket support
3. Create frontend application
4. Build system tray

Let me know which component you'd like to implement next!
