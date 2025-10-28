# Technology Stack Details

## Frontend Stack

### Core Framework
- **Vue.js 3.4+**
  - Composition API for better code organization
  - TypeScript support out of the box
  - `<script setup>` syntax for cleaner components
  - Reactivity system for efficient updates

### Build Tool
- **Vite 5.0+**
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized production builds
  - Native ES modules support
  - Plugin ecosystem

### Language
- **TypeScript 5.3+**
  - Static typing for better IDE support
  - Interface definitions shared with backend
  - Compile-time error detection

### State Management
- **Pinia**
  - Official Vue state management
  - TypeScript support
  - Devtools integration
  - Simple and intuitive API

### Routing
- **Vue Router 4**
  - Dynamic route matching
  - Nested routes
  - Route guards
  - History mode

### HTTP Client
- **Axios**
  - Promise-based requests
  - Interceptor support
  - Request/response transformation
  - Easy error handling

### UI Components & Styling

**Option A: Minimal Dependencies (Recommended)**
- **TailwindCSS** - Utility-first CSS
- **Headless UI** - Unstyled, accessible components
- Custom components for Git-specific UI

**Option B: Component Library**
- **Naive UI** - Vue 3 component library (lightweight)
- **Element Plus** - Enterprise-grade components (heavier)

**Recommended: Option A for maximum control and minimal bundle size**

### Additional Frontend Libraries

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0",
    "@vueuse/core": "^10.7.0",  // Composition utilities
    "date-fns": "^3.0.0",        // Date formatting
    "monaco-editor": "^0.45.0"   // Code/diff editor (optional)
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^1.0.0",          // Testing
    "@vue/test-utils": "^2.4.0"  // Vue component testing
  }
}
```

## Backend Stack

### Runtime & Language
- **Node.js 18+ LTS**
  - Stable, long-term support
  - Good performance
  - Large ecosystem

- **TypeScript 5.3+**
  - Same benefits as frontend
  - Shared types across stack

### Web Framework

**Option A: Express.js (Recommended for familiarity)**
```typescript
// Pros: Mature, large ecosystem, simple
// Cons: Slower than alternatives
```

**Option B: Fastify (Recommended for performance)**
```typescript
// Pros: Fast, low overhead, TypeScript support
// Cons: Smaller ecosystem than Express
```

**Recommendation: Fastify for better performance**

### Git Integration

**Option A: simple-git (Recommended)**
- Promise-based API
- Good TypeScript support
- Executes native git commands
- Well maintained

**Option B: isomorphic-git**
- Pure JavaScript implementation
- Works in browser (not needed here)
- May have compatibility issues with some Git features

**Recommendation: simple-git for full Git compatibility**

### System Tray

**Option A: Electron (Full-featured)**
```typescript
// Pros: Full desktop app, great tray support, updater
// Cons: Large bundle size (~150MB)
```

**Option B: node-systray2 (Lightweight)**
```typescript
// Pros: Lightweight (~5MB), simple API
// Cons: Limited features, platform-specific issues
```

**Option C: Tauri (Rust-based, future option)**
```typescript
// Pros: Small bundle (~3MB), modern, secure
// Cons: Requires Rust, newer ecosystem
```

**Recommendation: Start with Electron for features, consider Tauri later**

### WebSocket
- **Socket.io**
  - Easy to use
  - Fallback mechanisms
  - Room support for selective broadcasting
  - Good debugging tools

### Backend Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.25.0",
    "@fastify/cors": "^8.5.0",
    "@fastify/static": "^6.12.0",
    "simple-git": "^3.22.0",
    "socket.io": "^4.6.0",
    "dotenv": "^16.3.0",
    "zod": "^3.22.0",           // Schema validation
    "pino": "^8.17.0",          // Logging
    "pino-pretty": "^10.3.0",
    "lru-cache": "^10.1.0",     // In-memory LRU cache (PRIMARY CACHE)
    "lowdb": "^7.0.0",          // Optional JSON persistence
    "chokidar": "^3.5.3",       // File system watcher for cache invalidation
    "electron": "^28.1.0"       // Desktop tray application
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

## Shared Package

### Purpose
- Type definitions used by both frontend and backend
- Constants and enums
- Utility functions
- Validation schemas

### Structure
```typescript
// packages/shared/src/types/repository.ts
export interface Repository {
  id: string;
  name: string;
  path: string;
  // ...
}

// packages/shared/src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// packages/shared/src/constants/git.ts
export const GIT_STATUS = {
  ADDED: 'added',
  MODIFIED: 'modified',
  // ...
} as const;
```

## Development Tools

### Monorepo Management
- **pnpm** - Fast, efficient package manager with workspace support
- **Turborepo** (optional) - Build system optimizer for monorepos

### Code Quality
```json
{
  "devDependencies": {
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "prettier": "^3.1.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.2.0"
  }
}
```

### Testing
- **Vitest** - Frontend unit tests (Vite-native)
- **Jest** - Backend unit tests
- **Playwright** (optional) - E2E tests

## Deployment & Packaging

### Build Tools
- **electron-builder** - Package Electron apps
- **pkg** (alternative) - Package Node.js apps as executables

### Auto-updater
- **electron-updater** - Automatic app updates via GitHub releases

### Installers
- Windows: NSIS or MSI
- macOS: DMG or PKG
- Linux: AppImage, deb, or rpm

## Performance Libraries

### Frontend Optimization
```typescript
// Virtual scrolling for large lists
import { useVirtualList } from '@vueuse/core';

// Code splitting
const CommitHistory = defineAsyncComponent(() => 
  import('./views/CommitHistory.vue')
);
```

### Backend Optimization
```typescript
// PRIMARY: In-memory LRU cache with automatic eviction
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 500,                    // Max 500 items
  maxSize: 100 * 1024 * 1024, // 100MB limit
  sizeCalculation: (value) => JSON.stringify(value).length,
  ttl: 30000,                  // 30s default TTL
  updateAgeOnGet: true         // LRU behavior
});

// OPTIONAL: Persistent cache for expensive data (commit history, file content)
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const diskCache = new Low(new JSONFile('.forkweb/cache.json'));

// File system watcher for cache invalidation
import chokidar from 'chokidar';

const watcher = chokidar.watch(repoPath, {
  ignored: /(^|[\/\\])\../,
  ignoreInitial: true
});

watcher.on('change', () => cache.delete('status'));

// Worker threads for heavy operations (optional)
import { Worker } from 'worker_threads';
```

## Storage & Configuration

### For App Configuration and Repository Metadata

**LowDB (Recommended)**
- JSON-based local storage
- No setup required
- Perfect for settings, repo list, preferences
- Not for caching (use lru-cache instead)

```typescript
// Use LowDB for persistent app data, NOT for cache
const db = new Low(new JSONFile('.forkweb/config.json'));
await db.read();
db.data = { repositories: [], settings: {} };
await db.write();
```

### Cache vs Storage Decision Matrix

| Purpose | Use | Why |
|---------|-----|-----|
| Git status, branches | **lru-cache** (memory) | Fast, changes frequently |
| Commit history | **lru-cache** + lowdb (optional) | Expensive to fetch, rarely changes |
| File content (historical) | **lru-cache** + lowdb | Immutable, LRU evicts old items |
| App settings | **lowdb** | Persistent config, not cache |
| Repository list | **lowdb** | User data, must survive restart |
| User preferences | **lowdb** | Persistent, rarely accessed |

**Rule of Thumb:**
- **Cache** (lru-cache): Temporary, performance optimization, can regenerate
- **Storage** (lowdb): Permanent, user data, configuration

## Database Alternatives (NOT Recommended for This Project)

**SQLite** - Too heavy for cache, overkill for config
- Use only if you need complex queries
- Not needed for simple key-value storage

**Redis** - Requires external server
- Not suitable for desktop application
- Users won't install Redis

## Future Go Migration Considerations

### Libraries to Consider for Go Backend
- **go-git** - Pure Go git implementation
- **fiber** - Express-like web framework
- **gorilla/websocket** - WebSocket support
- **systray** - System tray for Go
- **fyne** or **wails** - Desktop UI frameworks

### Compatibility Strategy
```typescript
// Current TypeScript interface
interface IGitService {
  status(repoPath: string): Promise<GitStatus>;
}

// Future Go implementation
// type GitService interface {
//     Status(repoPath string) (*GitStatus, error)
// }

// Same HTTP API, different implementation language
```

## Summary Table

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend Framework | Vue 3 | Modern, TypeScript support, Composition API |
| Frontend Build | Vite | Fast, optimized, great DX |
| Backend Runtime | Node.js 18+ | Mature, good for prototyping |
| Backend Framework | Fastify | High performance, TypeScript |
| Git Library | simple-git | Full Git support, promise-based |
| System Tray | Electron | Rich features, auto-update |
| State Management | Pinia | Official Vue state library |
| HTTP Client | Axios | Battle-tested, interceptors |
| WebSocket | Socket.io | Real-time, fallback support |
| Styling | TailwindCSS | Utility-first, fast development |
| **Cache (Primary)** | **lru-cache** | **In-memory, LRU eviction, fast** |
| Cache (Persistence) | lowdb (optional) | Optional disk cache for expensive data |
| File Watching | chokidar | Auto cache invalidation |
| Storage | LowDB | App config and user data |
| Language | TypeScript | Type safety, better DX |
| Package Manager | pnpm | Fast, efficient, workspaces |

## Development vs Production

### Development
```bash
# Frontend: http://localhost:3000 (Vite dev server)
# Backend: http://localhost:3001 (Nodemon with ts-node)
# WebSocket: ws://localhost:3001
```

### Production
```bash
# Frontend: Built and served as static files by backend
# Backend: Compiled to JavaScript, run as executable
# System Tray: Manages server lifecycle
# Single port: 3001 (configurable)
```

This stack provides a solid foundation that's modern, performant, and maintainable while keeping the Go migration path clear.
