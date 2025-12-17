# .NET Backend for ForkWeb

A .NET 8+ backend implementation for ForkWeb, providing Git repository management through a REST API.

## Features

- **Clean Architecture**: Organized into Domain, Application, Infrastructure, and API layers
- **LibGit2Sharp**: High-performance native Git operations
- **Minimal APIs**: Simple and performant endpoint definitions
- **LRU Caching**: In-memory caching with automatic eviction
- **ProblemDetails**: RFC 7807 compliant error responses

## Getting Started

### Prerequisites

- .NET 8.0 SDK or later
- Git installed on your system

### Build and Run

```bash
cd packages/backend.net
dotnet restore
dotnet build
dotnet run
```

The API will be available at `http://localhost:5001`

### API Documentation

Once running, visit `http://localhost:5001/swagger` for interactive API documentation.

## API Endpoints

### Repositories
- `GET /api/repos` - List all repositories
- `GET /api/repos/{id}` - Get repository by ID
- `POST /api/repos` - Add repository
- `DELETE /api/repos/{id}` - Remove repository
- `POST /api/repos/{id}/refresh` - Refresh repository info

### Commits
- `GET /api/repos/{id}/commits` - Get commit history
- `GET /api/repos/{id}/commits/{sha}` - Get commit details

### Branches
- `GET /api/repos/{id}/branches` - List branches
- `POST /api/repos/{id}/branches` - Create branch
- `DELETE /api/repos/{id}/branches/{name}` - Delete branch
- `POST /api/repos/{id}/checkout` - Checkout branch

### Changes
- `GET /api/repos/{id}/status` - Get working directory status
- `GET /api/repos/{id}/diff` - Get diff
- `POST /api/repos/{id}/stage` - Stage files
- `POST /api/repos/{id}/unstage` - Unstage files
- `POST /api/repos/{id}/discard` - Discard changes
- `POST /api/repos/{id}/commit` - Create commit

## Project Structure

```
packages/backend.net/
├── Api/                    # Minimal API endpoints
├── Application/            # Application services & DTOs
│   ├── Services/
│   ├── Interfaces/
│   └── DTOs/
├── Domain/                 # Domain models
├── Infrastructure/         # Infrastructure implementations
│   ├── Git/               # LibGit2Sharp adapter
│   ├── Caching/           # LRU cache service
│   └── Storage/           # Repository storage
├── Middleware/            # Custom middleware
└── Program.cs             # Application entry point
```

## Configuration

Edit `appsettings.json` to configure:
- Port (default: 5001)
- Cache size (default: 100MB)
- Logging levels

## Comparison with Node.js Backend

- **Performance**: LibGit2Sharp provides native performance vs spawning git processes
- **Type Safety**: Compile-time type checking with C# records
- **Memory Management**: Automatic memory management with configurable limits
- **API Compatibility**: Same REST API endpoints with `/api/repos` prefix

## License

Same as the parent ForkWeb project.
