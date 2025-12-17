using ForkWeb.Backend.Application.Interfaces;
using ForkWeb.Backend.Domain;

namespace ForkWeb.Backend.Application.Services;

public class RepoService : IRepoService
{
    private readonly IRepoStorage _storage;
    private readonly IGitService _gitService;
    private readonly ILogger<RepoService> _logger;

    public RepoService(IRepoStorage storage, IGitService gitService, ILogger<RepoService> logger)
    {
        _storage = storage;
        _gitService = gitService;
        _logger = logger;
    }

    public async Task<List<Repo>> GetAllAsync()
    {
        return await _storage.GetAllAsync();
    }

    public async Task<Repo?> GetByIdAsync(string id)
    {
        return await _storage.GetByIdAsync(id);
    }

    public async Task<Repo> AddAsync(string path)
    {
        // Validate path
        if (!Directory.Exists(path))
        {
            throw new DirectoryNotFoundException($"Directory not found: {path}");
        }

        var gitDir = Path.Combine(path, ".git");
        if (!Directory.Exists(gitDir))
        {
            throw new InvalidOperationException($"Not a git repository: {path}");
        }

        // Get repository info
        var status = await _gitService.GetStatusAsync(path);
        var branches = await _gitService.GetBranchesAsync(path);
        var currentBranch = branches.FirstOrDefault(b => b.Current)?.Name ?? "main";

        var repo = new Repo(
            Id: Guid.NewGuid().ToString(),
            Name: Path.GetFileName(path),
            Path: path,
            CurrentBranch: currentBranch,
            Remotes: new List<Remote>(), // TODO: Get remotes from Git
            LastUpdated: DateTime.UtcNow,
            Tags: null,
            IsBare: false
        );

        return await _storage.AddAsync(repo);
    }

    public async Task RemoveAsync(string id)
    {
        var repo = await _storage.GetByIdAsync(id);
        if (repo == null)
        {
            throw new KeyNotFoundException($"Repo not found: {id}");
        }

        await _storage.RemoveAsync(id);
    }

    public async Task<Repo> RefreshAsync(string id)
    {
        var repo = await _storage.GetByIdAsync(id);
        if (repo == null)
        {
            throw new KeyNotFoundException($"Repo not found: {id}");
        }

        var branches = await _gitService.GetBranchesAsync(repo.Path);
        var currentBranch = branches.FirstOrDefault(b => b.Current)?.Name ?? repo.CurrentBranch;

        var updatedRepo = repo with
        {
            CurrentBranch = currentBranch,
            LastUpdated = DateTime.UtcNow
        };

        return await _storage.UpdateAsync(updatedRepo);
    }
}
