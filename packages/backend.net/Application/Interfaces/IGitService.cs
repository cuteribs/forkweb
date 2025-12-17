using ForkWeb.Backend.Application.DTOs;
using ForkWeb.Backend.Domain;

namespace ForkWeb.Backend.Application.Interfaces;

public interface IGitService
{
    Task<GitStatus> GetStatusAsync(string repoPath);
    Task<PaginatedResponse<Commit>> GetCommitsAsync(string repoPath, LogOptions options);
    Task<Commit?> GetCommitAsync(string repoPath, string sha);
    Task<List<Diff>> GetDiffAsync(string repoPath, DiffOptions options);
    Task StageFilesAsync(string repoPath, string[] files);
    Task UnstageFilesAsync(string repoPath, string[] files);
    Task DiscardChangesAsync(string repoPath, string[] files);
    Task<string> CreateCommitAsync(string repoPath, string message, bool amend = false);
    Task<List<Branch>> GetBranchesAsync(string repoPath);
    Task CreateBranchAsync(string repoPath, string name, string? startPoint = null);
    Task DeleteBranchAsync(string repoPath, string name, bool force = false);
    Task CheckoutAsync(string repoPath, string target, bool createBranch = false);
    Task FetchAsync(string repoPath, string remote = "origin");
    Task PullAsync(string repoPath, string remote = "origin", string? branch = null, bool rebase = false);
    Task PushAsync(string repoPath, string remote = "origin", string? branch = null, bool force = false);
}
