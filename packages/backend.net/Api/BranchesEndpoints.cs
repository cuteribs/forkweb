using ForkWeb.Backend.Application.DTOs;
using ForkWeb.Backend.Application.Interfaces;

namespace ForkWeb.Backend.Api;

public static class BranchesEndpoints
{
    public static void MapBranchesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/repos/{id}").WithTags("Branches");

        group.MapGet("/branches", async (string id, IRepoService repoService, IGitService gitService) =>
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

            var branches = await gitService.GetBranchesAsync(repo.Path);
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Data: branches,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapPost("/branches", async (string id, CreateBranchRequest request, 
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

            await gitService.CreateBranchAsync(repo.Path, request.Name, request.StartPoint);
            
            if (request.Checkout)
            {
                await gitService.CheckoutAsync(repo.Path, request.Name);
            }

            return Results.Created($"/api/repos/{id}/branches", new ApiResponse<object>(
                Success: true,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapDelete("/branches/{name}", async (string id, string name, bool force,
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

            await gitService.DeleteBranchAsync(repo.Path, name, force);
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });

        group.MapPost("/checkout", async (string id, CheckoutRequest request,
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

            var target = request.Branch ?? request.Commit ?? throw new InvalidOperationException("Branch or Commit required");
            await gitService.CheckoutAsync(repo.Path, target, request.CreateBranch);
            
            return Results.Ok(new ApiResponse<object>(
                Success: true,
                Timestamp: DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            ));
        });
    }
}
