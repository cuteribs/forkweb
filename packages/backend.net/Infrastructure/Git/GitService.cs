using ForkWeb.Backend.Application.DTOs;
using ForkWeb.Backend.Application.Interfaces;
using ForkWeb.Backend.Domain;
using LibGit2Sharp;

namespace ForkWeb.Backend.Infrastructure.Git;

public class GitService : IGitService
{
    private readonly ICacheService _cache;
    private readonly ILogger<GitService> _logger;

    public GitService(ICacheService cache, ILogger<GitService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<GitStatus> GetStatusAsync(string repoPath)
    {
        return await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var status = repo.RetrieveStatus();

            var staged = new List<FileChange>();
            var unstaged = new List<FileChange>();
            var untracked = new List<string>();

            foreach (var entry in status)
            {
                if (entry.State.HasFlag(LibGit2Sharp.FileStatus.NewInIndex) ||
                    entry.State.HasFlag(LibGit2Sharp.FileStatus.ModifiedInIndex) ||
                    entry.State.HasFlag(LibGit2Sharp.FileStatus.DeletedFromIndex))
                {
                    staged.Add(new FileChange(
                        Path: entry.FilePath,
                        OldPath: null,
                        Status: MapFileStatus(entry.State),
                        Staged: true,
                        WorkingDir: false
                    ));
                }

                if (entry.State.HasFlag(LibGit2Sharp.FileStatus.ModifiedInWorkdir) ||
                    entry.State.HasFlag(LibGit2Sharp.FileStatus.DeletedFromWorkdir))
                {
                    unstaged.Add(new FileChange(
                        Path: entry.FilePath,
                        OldPath: null,
                        Status: MapFileStatus(entry.State),
                        Staged: false,
                        WorkingDir: true
                    ));
                }

                if (entry.State.HasFlag(LibGit2Sharp.FileStatus.NewInWorkdir))
                {
                    untracked.Add(entry.FilePath);
                }
            }

            var allChanges = staged.Concat(unstaged).ToList();

            return new GitStatus(
                Current: repo.Head.FriendlyName,
                Tracking: repo.Head.TrackedBranch?.FriendlyName,
                Ahead: repo.Head.TrackingDetails?.AheadBy ?? 0,
                Behind: repo.Head.TrackingDetails?.BehindBy ?? 0,
                Files: allChanges,
                Staged: staged,
                Unstaged: unstaged,
                Untracked: untracked,
                Conflicted: new List<string>()
            );
        });
    }

    public async Task<PaginatedResponse<Domain.Commit>> GetCommitsAsync(string repoPath, LogOptions options)
    {
        return await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var filter = new CommitFilter
            {
                SortBy = CommitSortStrategies.Time,
                IncludeReachableFrom = options.Branch != null 
                    ? repo.Branches[options.Branch] 
                    : repo.Head
            };

            var commits = repo.Commits.QueryBy(filter)
                .Skip(options.Skip ?? 0)
                .Take(options.MaxCount ?? 50)
                .Select(c => new Domain.Commit(
                    Sha: c.Sha,
                    Message: c.Message,
                    Author: new Author(c.Author.Name, c.Author.Email, c.Author.When.UtcDateTime),
                    Committer: new Author(c.Committer.Name, c.Committer.Email, c.Committer.When.UtcDateTime),
                    Date: c.Author.When.UtcDateTime,
                    Parents: c.Parents.Select(p => p.Sha).ToList()
                ))
                .ToList();

            var total = repo.Commits.QueryBy(filter).Count();

            return new PaginatedResponse<Domain.Commit>(
                Items: commits,
                Total: total,
                Page: (options.Skip ?? 0) / (options.MaxCount ?? 50),
                PageSize: options.MaxCount ?? 50,
                HasMore: (options.Skip ?? 0) + commits.Count < total
            );
        });
    }

    public async Task<Domain.Commit?> GetCommitAsync(string repoPath, string sha)
    {
        return await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var commit = repo.Lookup<LibGit2Sharp.Commit>(sha);
            if (commit == null) return null;

            return new Domain.Commit(
                Sha: commit.Sha,
                Message: commit.Message,
                Author: new Author(commit.Author.Name, commit.Author.Email, commit.Author.When.UtcDateTime),
                Committer: new Author(commit.Committer.Name, commit.Committer.Email, commit.Committer.When.UtcDateTime),
                Date: commit.Author.When.UtcDateTime,
                Parents: commit.Parents.Select(p => p.Sha).ToList()
            );
        });
    }

    public async Task<List<Domain.Diff>> GetDiffAsync(string repoPath, DiffOptions options)
    {
        // Simplified implementation - return empty for now
        return await Task.FromResult(new List<Domain.Diff>());
    }

    public async Task StageFilesAsync(string repoPath, string[] files)
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            Commands.Stage(repo, files);
        });
    }

    public async Task UnstageFilesAsync(string repoPath, string[] files)
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            Commands.Unstage(repo, files);
        });
    }

    public async Task DiscardChangesAsync(string repoPath, string[] files)
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var options = new CheckoutOptions { CheckoutModifiers = CheckoutModifiers.Force };
            repo.CheckoutPaths(repo.Head.FriendlyName, files, options);
        });
    }

    public async Task<string> CreateCommitAsync(string repoPath, string message, bool amend = false)
    {
        return await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var author = repo.Config.BuildSignature(DateTimeOffset.Now);
            var commit = repo.Commit(message, author, author);
            return commit.Sha;
        });
    }

    public async Task<List<Domain.Branch>> GetBranchesAsync(string repoPath)
    {
        return await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            return repo.Branches.Select(b => new Domain.Branch(
                Name: b.FriendlyName,
                Type: b.IsRemote ? BranchType.Remote : BranchType.Local,
                Current: b.IsCurrentRepositoryHead,
                Commit: b.Tip.Sha,
                Upstream: b.TrackedBranch?.FriendlyName,
                Ahead: b.TrackingDetails?.AheadBy,
                Behind: b.TrackingDetails?.BehindBy
            )).ToList();
        });
    }

    public async Task CreateBranchAsync(string repoPath, string name, string? startPoint = null)
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var commit = startPoint != null ? repo.Lookup<LibGit2Sharp.Commit>(startPoint) : repo.Head.Tip;
            repo.CreateBranch(name, commit);
        });
    }

    public async Task DeleteBranchAsync(string repoPath, string name, bool force = false)
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var branch = repo.Branches[name];
            if (branch != null)
            {
                repo.Branches.Remove(branch);
            }
        });
    }

    public async Task CheckoutAsync(string repoPath, string target, bool createBranch = false)
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            Commands.Checkout(repo, target);
        });
    }

    public async Task FetchAsync(string repoPath, string remote = "origin")
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var remoteObj = repo.Network.Remotes[remote];
            if (remoteObj != null)
            {
                Commands.Fetch(repo, remote, Array.Empty<string>(), null, null);
            }
        });
    }

    public async Task PullAsync(string repoPath, string remote = "origin", string? branch = null, bool rebase = false)
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var signature = repo.Config.BuildSignature(DateTimeOffset.Now);
            Commands.Pull(repo, signature, null);
        });
    }

    public async Task PushAsync(string repoPath, string remote = "origin", string? branch = null, bool force = false)
    {
        await Task.Run(() =>
        {
            using var repo = new Repository(repoPath);
            var currentBranch = repo.Head;
            repo.Network.Push(currentBranch);
        });
    }

    private Domain.FileStatus MapFileStatus(LibGit2Sharp.FileStatus status)
    {
        if (status.HasFlag(LibGit2Sharp.FileStatus.NewInIndex) || status.HasFlag(LibGit2Sharp.FileStatus.NewInWorkdir))
            return Domain.FileStatus.Added;
        if (status.HasFlag(LibGit2Sharp.FileStatus.DeletedFromIndex) || status.HasFlag(LibGit2Sharp.FileStatus.DeletedFromWorkdir))
            return Domain.FileStatus.Deleted;
        if (status.HasFlag(LibGit2Sharp.FileStatus.RenamedInIndex) || status.HasFlag(LibGit2Sharp.FileStatus.RenamedInWorkdir))
            return Domain.FileStatus.Renamed;
        return Domain.FileStatus.Modified;
    }
}
