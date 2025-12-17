using ForkWeb.Backend.Application.Interfaces;
using ForkWeb.Backend.Domain;
using System.Text.Json;

namespace ForkWeb.Backend.Infrastructure.Storage;

public class RepoStorage : IRepoStorage
{
    private readonly string _storagePath;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly JsonSerializerOptions _jsonOptions;

    public RepoStorage(string? storagePath = null)
    {
        _storagePath = storagePath ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".forkweb",
            "repos.json"
        );

        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        EnsureStorageDirectory();
    }

    public async Task<List<Repo>> GetAllAsync()
    {
        await _lock.WaitAsync();
        try
        {
            if (!File.Exists(_storagePath))
            {
                return new List<Repo>();
            }

            var json = await File.ReadAllTextAsync(_storagePath);
            return JsonSerializer.Deserialize<List<Repo>>(json, _jsonOptions) ?? new List<Repo>();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<Repo?> GetByIdAsync(string id)
    {
        var repos = await GetAllAsync();
        return repos.FirstOrDefault(r => r.Id == id);
    }

    public async Task<Repo> AddAsync(Repo repo)
    {
        await _lock.WaitAsync();
        try
        {
            var repos = await GetAllAsync();
            repos.Add(repo);
            await SaveAsync(repos);
            return repo;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<Repo> UpdateAsync(Repo repo)
    {
        await _lock.WaitAsync();
        try
        {
            var repos = await GetAllAsync();
            var index = repos.FindIndex(r => r.Id == repo.Id);
            if (index == -1)
            {
                throw new InvalidOperationException($"Repo with ID {repo.Id} not found");
            }

            repos[index] = repo;
            await SaveAsync(repos);
            return repo;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task RemoveAsync(string id)
    {
        await _lock.WaitAsync();
        try
        {
            var repos = await GetAllAsync();
            repos.RemoveAll(r => r.Id == id);
            await SaveAsync(repos);
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task SaveAsync(List<Repo> repos)
    {
        // Create backup
        if (File.Exists(_storagePath))
        {
            var backupPath = _storagePath + ".backup";
            File.Copy(_storagePath, backupPath, true);
        }

        var json = JsonSerializer.Serialize(repos, _jsonOptions);
        await File.WriteAllTextAsync(_storagePath, json);
    }

    private void EnsureStorageDirectory()
    {
        var directory = Path.GetDirectoryName(_storagePath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }
}
