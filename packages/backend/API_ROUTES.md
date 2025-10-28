# API Routes Documentation

## Overview

The ForkWeb backend provides a RESTful API for Git operations. All endpoints return JSON responses in the `ApiResponse` format:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}
```

## Health Check

### GET `/api/health`
Check server health and cache statistics.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "cache": {
    "size": 42,
    "maxSize": 104857600
  }
}
```

## Repositories

### GET `/api/repositories`
List all repositories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "repo-123",
      "name": "my-project",
      "path": "/path/to/repo",
      "currentBranch": "main"
    }
  ],
  "timestamp": 1234567890
}
```

### GET `/api/repositories/:id`
Get a single repository by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "repo-123",
    "name": "my-project",
    "path": "/path/to/repo",
    "currentBranch": "main"
  },
  "timestamp": 1234567890
}
```

### POST `/api/repositories`
Add a new repository.

**Request Body:**
```json
{
  "path": "/path/to/repo"
}
```

**Response:** (Status 201)
```json
{
  "success": true,
  "data": {
    "id": "repo-123",
    "name": "my-project",
    "path": "/path/to/repo",
    "currentBranch": "main"
  },
  "timestamp": 1234567890
}
```

### DELETE `/api/repositories/:id`
Remove a repository from the list.

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/refresh`
Refresh repository information (e.g., current branch).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "repo-123",
    "name": "my-project",
    "path": "/path/to/repo",
    "currentBranch": "feature-branch"
  },
  "timestamp": 1234567890
}
```

## Commits

### GET `/api/repositories/:id/commits`
Get commit history.

**Query Parameters:**
- `branch` (optional): Filter by branch name
- `limit` (optional, default: 50): Number of commits to return
- `skip` (optional, default: 0): Number of commits to skip (pagination)
- `author` (optional): Filter by author
- `path` (optional): Filter by file path

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "sha": "abc123",
        "message": "Commit message",
        "author": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "date": 1234567890,
        "parents": ["def456"]
      }
    ],
    "total": 100,
    "page": 0,
    "pageSize": 50,
    "hasMore": true
  },
  "timestamp": 1234567890
}
```

### GET `/api/repositories/:id/commits/:sha`
Get a specific commit by SHA.

**Response:**
```json
{
  "success": true,
  "data": {
    "sha": "abc123",
    "message": "Commit message",
    "author": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "date": 1234567890,
    "parents": ["def456"],
    "changes": [...]
  },
  "timestamp": 1234567890
}
```

## Branches

### GET `/api/repositories/:id/branches`
List all branches.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "main",
      "isCurrent": true,
      "isRemote": false,
      "commit": "abc123"
    },
    {
      "name": "feature-branch",
      "isCurrent": false,
      "isRemote": false,
      "commit": "def456"
    }
  ],
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/branches`
Create a new branch.

**Request Body:**
```json
{
  "name": "feature-branch",
  "startPoint": "main",
  "checkout": false
}
```

**Response:** (Status 201)
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

### DELETE `/api/repositories/:id/branches/:name`
Delete a branch.

**Query Parameters:**
- `force` (optional, default: false): Force delete even if not fully merged

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/checkout`
Checkout a branch or commit.

**Request Body:**
```json
{
  "branch": "feature-branch",
  "commit": null,
  "createBranch": false
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

## Changes (Working Directory)

### GET `/api/repositories/:id/status`
Get working directory status.

**Response:**
```json
{
  "success": true,
  "data": {
    "branch": "main",
    "ahead": 2,
    "behind": 1,
    "staged": [
      {
        "path": "file.txt",
        "status": "modified"
      }
    ],
    "unstaged": [
      {
        "path": "other.txt",
        "status": "modified"
      }
    ],
    "untracked": [
      {
        "path": "new.txt",
        "status": "untracked"
      }
    ]
  },
  "timestamp": 1234567890
}
```

### GET `/api/repositories/:id/diff`
Get diff for changes.

**Query Parameters:**
- `path` (optional): File path to diff
- `staged` (optional, default: false): Show staged changes
- `context` (optional, default: 3): Number of context lines

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "path": "file.txt",
      "status": "modified",
      "additions": 5,
      "deletions": 3,
      "hunks": [...]
    }
  ],
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/stage`
Stage files.

**Request Body:**
```json
{
  "files": ["file1.txt", "file2.txt"]
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/unstage`
Unstage files.

**Request Body:**
```json
{
  "files": ["file1.txt", "file2.txt"]
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/discard`
Discard changes.

**Request Body:**
```json
{
  "files": ["file1.txt", "file2.txt"]
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/commit`
Create a commit.

**Request Body:**
```json
{
  "message": "Commit message",
  "amend": false
}
```

**Response:** (Status 201)
```json
{
  "success": true,
  "data": {
    "sha": "abc123"
  },
  "timestamp": 1234567890
}
```

## Files

### GET `/api/repositories/:id/tree`
Get file tree.

**Query Parameters:**
- `ref` (optional, default: "HEAD"): Git reference (branch, tag, commit)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "path": "src",
      "type": "tree",
      "children": [
        {
          "path": "src/index.ts",
          "type": "blob",
          "size": 1234
        }
      ]
    }
  ],
  "timestamp": 1234567890
}
```

### GET `/api/repositories/:id/blob`
Get file content.

**Query Parameters:**
- `path` (required): File path
- `ref` (optional, default: "HEAD"): Git reference

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "file contents here"
  },
  "timestamp": 1234567890
}
```

## Remote Operations

### POST `/api/repositories/:id/fetch`
Fetch from remote.

**Query Parameters:**
- `remote` (optional, default: "origin"): Remote name

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/pull`
Pull from remote.

**Request Body:**
```json
{
  "remote": "origin",
  "branch": "main",
  "rebase": false
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

### POST `/api/repositories/:id/push`
Push to remote.

**Request Body:**
```json
{
  "remote": "origin",
  "branch": "main",
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "timestamp": 1234567890
}
```

**Common Error Codes:**
- `REPO_NOT_FOUND` - Repository not found (404)
- `REPO_INVALID` - Invalid repository path (400)
- `GIT_ERROR` - Git operation failed (400)
- `FILE_NOT_FOUND` - File not found (404)
- `INVALID_REQUEST` - Invalid request parameters (400)
- `INTERNAL_ERROR` - Internal server error (500)

## Caching

The API automatically caches responses for better performance:

- **Status**: 3 seconds TTL
- **Branches**: 15 seconds TTL
- **Commits**: 5 minutes TTL (persisted to disk)
- **Historical files**: Infinite TTL (persisted to disk)
- **Working files**: 2 seconds TTL

Cache is automatically invalidated when:
- File system changes are detected
- Write operations are performed (commit, stage, checkout, etc.)
