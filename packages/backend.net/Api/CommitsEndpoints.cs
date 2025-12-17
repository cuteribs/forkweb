using ForkWeb.Backend.Application.DTOs;
using ForkWeb.Backend.Application.Interfaces;
using ForkWeb.Backend.Domain;

namespace ForkWeb.Backend.Api;

public static class CommitsEndpoints
{
    public static void MapCommitsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/repos/{id}/commits").WithTags("Commits");

        group.MapGet("/", async (string id, IRepoService repoService, IGitService gitService,
            string? branch = null, int limit = 50, int skip = 0) =>
        {
            var repo = await repoService.GetByIdAsync(id);
            if (repo == null)
            {
                return Results.NotFound(new ApiResponse<object>(
                    Success: false,
                    Error: new ApiError("NOT_FOUND", $"Repo not found: {id}"),
                    Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                ));
            }

            var options = new LogOptions(Branch: branch, MaxCount: limit, Skip: skip);
            var commits = await gitService.GetCommitsAsync(repo.Path, options);

            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Data: commits,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapGet("/{sha}", async (string id, string sha, IRepoService repoService, IGitService gitService) =>
        {
            var repo = await repoService.GetByIdAsync(id);
            if (repo == null)
            {
                return Results.NotFound(new ApiResponse<object>(
                    Success: false,
                    Error: new ApiError("NOT_FOUND", $"Repo not found: {id}"),
                    Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                ));
            }

            var commit = await gitService.GetCommitAsync(repo.Path, sha);
            if (commit == null)
            {
                return Results.NotFound(new ApiResponse<object>(
                    Success: false,
                    Error: new ApiError("NOT_FOUND", $"Commit not found: {sha}"),
                    Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                ));
            }

            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Data: commit,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });
    }
}
