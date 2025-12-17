using ForkWeb.Backend.Application.DTOs;
using ForkWeb.Backend.Application.Interfaces;

namespace ForkWeb.Backend.Api;

public static class ReposEndpoints
{
    public static void MapReposEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/repos").WithTags("Repositories");

        group.MapGet("/", async (IRepoService repoService) =>
        {
            var repos = await repoService.GetAllAsync();
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Data: repos,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapGet("/{id}", async (string id, IRepoService repoService) =>
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

            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Data: repo,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapPost("/", async (AddRepoRequest request, IRepoService repoService) =>
        {
            var repo = await repoService.AddAsync(request.Path);
            return Results.Created($"/api/repos/{repo.Id}", new ApiResponse<object>(
                Success: true,
                Data: repo,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapDelete("/{id}", async (string id, IRepoService repoService) =>
        {
            await repoService.RemoveAsync(id);
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapPost("/{id}/refresh", async (string id, IRepoService repoService) =>
        {
            var repo = await repoService.RefreshAsync(id);
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Data: repo,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });
    }
}
