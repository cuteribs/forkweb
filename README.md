# ForkWeb - Git Web UI

A lightweight, fast web-based Git client with Vue.js frontend and Node.js backend, designed to browse repositories, branches, commits, and changes.

## 🎉 Status: **READY TO USE**

Both frontend and backend are fully implemented and running:
- **Backend**: http://localhost:3001 (Fastify API with 23 endpoints)
- **Frontend**: http://localhost:5173 (Vue 3 + TailwindCSS)
- **Build**: All packages build successfully
- **Views**: Repository list, changes (with diff viewer), commits, branches, and file browser

## Features

- 🚀 **Fast & Lightweight** - In-memory LRU caching with optional persistence
- 📊 **Repository Management** - Add, browse, and manage multiple Git repositories
- 📝 **Commit History** - Paginated commit history with branch filtering
- 🌿 **Branch Operations** - Create, delete, checkout branches
- 📂 **File Browser** - Navigate file tree and view file contents
- ⚡ **Real-time Updates** - WebSocket-based live repository updates
- 🎨 **Compact Dark UI** - Vue 3 with TypeScript and TailwindCSS (dense, responsive design)
- 🔄 **Smart Caching** - Automatic cache invalidation based on file changes
- 🔧 **Go-Ready** - Clean interfaces designed for future Go migration

## Architecture

### Technology Stack
- **Frontend**: Vue 3, TypeScript, Vite, Pinia, TailwindCSS
- **Backend**: Node.js, TypeScript, Fastify, simple-git
- **Cache**: lru-cache (in-memory) + lowdb (persistence)
- **WebSocket**: Socket.io
- **System Tray**: Electron
- **File Watching**: chokidar

### Key Components
- **CacheService**: LRU cache with automatic eviction and optional disk persistence
- **GitService**: Git operations with transparent caching layer
- **RepositoryService**: Repository management and metadata
- **FileSystemWatcher**: Automatic cache invalidation on file changes
- **CacheInvalidator**: Operation-based cache invalidation

## Project Structure

```
forkweb/
├── packages/
│   ├── shared/           # Shared types and constants
│   ├── backend/          # Node.js backend
│   └── frontend/         # Vue.js frontend
├── docs/                 # Documentation
├── ARCHITECTURE.md       # Detailed architecture design
├── TECH_STACK.md        # Technology stack details
├── GETTING_STARTED.md   # Setup instructions
└── IMPLEMENTATION.md    # Implementation guide
```

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Git installed on your system

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd forkweb

# Install dependencies
pnpm install

# Build shared package
pnpm --filter shared build

# Start development servers
pnpm dev
```

### Development

```bash
# Backend only
pnpm --filter backend dev

# Frontend only
pnpm --filter frontend dev

# Build for production
pnpm build
```

## Configuration

Create `.env` file in `packages/backend/`:

```env
PORT=3001
HOST=localhost
NODE_ENV=development

# Cache settings
CACHE_ENABLED=true
CACHE_MAX_SIZE=104857600
CACHE_PERSISTENCE=true

# Repository settings
REPO_WATCH_CHANGES=true
```

## Caching Strategy

### In-Memory (Primary)
- **Git Status**: 3s TTL
- **Branches**: 15s TTL
- **Commits**: 5m TTL
- **File Content**: LRU-managed

### Disk (Optional)
- Commit history
- Historical file content
- Survives restarts

### Auto-Invalidation
- File system watching (chokidar)
- Operation-based invalidation
- Tag-based bulk invalidation

## API Endpoints

### Repositories
- `GET /api/repositories` - List repositories
- `POST /api/repositories` - Add repository
- `GET /api/repositories/:id` - Get repository
- `DELETE /api/repositories/:id` - Remove repository

### Commits
- `GET /api/repositories/:id/commits` - Commit history
- `GET /api/repositories/:id/commits/:sha` - Commit details

### Changes
- `GET /api/repositories/:id/status` - Working directory status
- `POST /api/repositories/:id/stage` - Stage files
- `POST /api/repositories/:id/unstage` - Unstage files
- `POST /api/repositories/:id/commit` - Create commit

### Branches
- `GET /api/repositories/:id/branches` - List branches
- `POST /api/repositories/:id/branches` - Create branch
- `DELETE /api/repositories/:id/branches/:name` - Delete branch
- `POST /api/repositories/:id/checkout` - Checkout branch

## WebSocket Events

### Client → Server
- `subscribe:repository` - Subscribe to updates
- `unsubscribe:repository` - Unsubscribe

### Server → Client
- `repository:changed` - Repository state changed
- `operation:progress` - Operation progress
- `operation:complete` - Operation completed
- `operation:error` - Operation error

## Performance

- **Sub-millisecond** cache hits (in-memory)
- **LRU eviction** prevents memory bloat
- **File watching** for automatic cache invalidation
- **Virtual scrolling** for large commit lists
- **Code splitting** for fast initial load

## Security

- Path traversal protection
- Command injection prevention
- Local-only access (localhost binding)
- Input validation with Zod
- CORS configuration
- Rate limiting

## Go Migration Path

All backend services implement interfaces that can be ported to Go:

```typescript
// TypeScript
interface IGitService {
  status(repoPath: string): Promise<GitStatus>;
}

// Future Go
type GitService interface {
    Status(repoPath string) (*GitStatus, error)
}
```

Same HTTP API contracts maintained during migration.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design
- [TECH_STACK.md](TECH_STACK.md) - Technology choices and rationale
- [GETTING_STARTED.md](GETTING_STARTED.md) - Setup and development guide
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Implementation status and roadmap

## License

MIT

## Status

🚧 **Active Development** - Core backend infrastructure completed, API routes and frontend in progress.

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for current status and roadmap.
