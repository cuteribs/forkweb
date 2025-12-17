using ForkWeb.Backend.Application.DTOs;
using ForkWeb.Backend.Application.Interfaces;
using ForkWeb.Backend.Domain;

namespace ForkWeb.Backend.Api;

public static class ChangesEndpoints
{
    public static void MapChangesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/repos/{id}").WithTags("Changes");

        group.MapGet("/status", async (string id, IRepoService repoService, IGitService gitService) =>
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

            var status = await gitService.GetStatusAsync(repo.Path);
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Data: status,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapGet("/diff", async (string id, IRepoService repoService, IGitService gitService,
            string? path = null, bool staged = false, int context = 3) =>
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

            var options = new DiffOptions(Path: path, Staged: staged, Context: context);
            var diff = await gitService.GetDiffAsync(repo.Path, options);
            
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Data: diff,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapPost("/stage", async (string id, StageFilesRequest request,
            IRepoService repoService, IGitService gitService) =>
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

            await gitService.StageFilesAsync(repo.Path, request.Files.ToArray());
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapPost("/unstage", async (string id, UnstageFilesRequest request,
            IRepoService repoService, IGitService gitService) =>
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

            await gitService.UnstageFilesAsync(repo.Path, request.Files.ToArray());
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapPost("/discard", async (string id, DiscardChangesRequest request,
            IRepoService repoService, IGitService gitService) =>
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

            await gitService.DiscardChangesAsync(repo.Path, request.Files.ToArray());
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapPost("/commit", async (string id, CreateCommitRequest request,
            IRepoService repoService, IGitService gitService) =>
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

            var sha = await gitService.CreateCommitAsync(repo.Path, request.Message, request.Amend);
            return Results.Created($"/api/repos/{id}/commits/{sha}", new ApiResponse<object>(
                Success: true,
                Data: new { sha },
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });
    }
}
