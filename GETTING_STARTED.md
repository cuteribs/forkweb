# Getting Started with ForkWeb

## Prerequisites

- Node.js 18+ and npm/pnpm
- Git installed on your system
- TypeScript knowledge
- Vue.js 3 experience

## Initial Setup

### 1. Create Monorepo Structure

```bash
# Create workspace configuration
mkdir -p packages/{frontend,backend,shared}
```

### 2. Initialize Package Manager

```bash
# Using pnpm (recommended for monorepos)
npm install -g pnpm

# Create workspace file
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
EOF
```

### 3. Root Package Configuration

```json
{
  "name": "forkweb",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter \"./packages/**\" dev",
    "build": "pnpm --filter \"./packages/**\" build",
    "test": "pnpm --filter \"./packages/**\" test",
    "lint": "pnpm --filter \"./packages/**\" lint"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "turbo": "^1.11.0"
  }
}
```

## Package Setup

### Shared Package

```bash
cd packages/shared
pnpm init
pnpm add -D typescript @types/node
```

**packages/shared/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Backend Package

```bash
cd packages/backend
pnpm init
pnpm add express simple-git socket.io cors dotenv
pnpm add -D typescript @types/node @types/express @types/cors ts-node nodemon
```

**packages/backend/package.json (scripts)**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest"
  }
}
```

**packages/backend/tsconfig.json**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "commonjs",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Frontend Package

```bash
cd packages/frontend
pnpm create vite . --template vue-ts
pnpm add vue-router pinia axios
pnpm add -D @vitejs/plugin-vue typescript tailwindcss
```

**packages/frontend/vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
```

## Development Steps

### Phase 1: Core Infrastructure (Week 1)

1. **Setup shared types**
   - Create interface definitions
   - Define common types
   - Export shared constants

2. **Backend foundation**
   - Express server setup
   - Basic routing structure
   - Git service abstraction
   - Repository management

3. **Frontend foundation**
   - Vue app structure
   - Router configuration
   - Pinia store setup
   - API client layer

### Phase 2: Basic Features (Week 2-3)

1. **Repository Management**
   - List repositories
   - Add/remove repositories
   - Repository details

2. **Commit History**
   - Fetch commit log
   - Display commit list
   - Commit details view

3. **Branch Operations**
   - List branches
   - Switch branches
   - Create/delete branches

### Phase 3: Advanced Features (Week 4-5)

1. **Changes View**
   - Working directory status
   - Diff viewer
   - Stage/unstage files
   - Commit changes

2. **File Browser**
   - Repository file tree
   - File content viewer
   - Blame view

### Phase 4: System Integration (Week 6)

1. **System Tray**
   - Electron/systray setup
   - Tray menu
   - Server lifecycle

2. **Real-time Updates**
   - WebSocket integration
   - Live repository updates

### Phase 5: Polish & Packaging (Week 7-8)

1. **UI/UX refinement**
2. **Performance optimization**
3. **Testing**
4. **Documentation**
5. **Build & packaging**

## Quick Start Commands

```bash
# Install all dependencies
pnpm install

# Start development servers (backend + frontend)
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## Project Scripts Breakdown

### Root-level Commands
- `pnpm dev` - Start all packages in dev mode
- `pnpm build` - Build all packages for production
- `pnpm clean` - Clean all build artifacts
- `pnpm test` - Run all tests

### Backend Commands
```bash
cd packages/backend
pnpm dev          # Start dev server with hot reload
pnpm build        # Build TypeScript to JavaScript
pnpm start        # Start production server
pnpm test         # Run tests
pnpm lint         # Lint code
```

### Frontend Commands
```bash
cd packages/frontend
pnpm dev          # Start Vite dev server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm test         # Run tests
pnpm lint         # Lint code
```

## Environment Variables

### Backend (.env)
```env
PORT=3001
HOST=localhost
NODE_ENV=development
LOG_LEVEL=debug
CACHE_ENABLED=true
CACHE_TTL=300
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Tips for Development

1. **Use TypeScript strictly** - Enable all strict mode options
2. **Keep interfaces clean** - Think about Go migration from the start
3. **Test as you go** - Write tests for services and APIs
4. **Use meaningful commits** - Follow conventional commits
5. **Document decisions** - Keep ADR (Architecture Decision Records)

## Next Steps

1. Review the ARCHITECTURE.md for detailed design
2. Set up the monorepo structure
3. Start with shared types
4. Build backend core services
5. Develop frontend views incrementally
6. Integrate system tray
7. Package and distribute

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Express.js Guide](https://expressjs.com/)
- [simple-git Documentation](https://github.com/steveukx/git-js)
- [Electron Documentation](https://www.electronjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
