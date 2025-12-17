using ForkWeb.Backend.Api;
using ForkWeb.Backend.Application.Interfaces;
using ForkWeb.Backend.Application.Services;
using ForkWeb.Backend.Infrastructure.Caching;
using ForkWeb.Backend.Infrastructure.Storage;
using ForkWeb.Backend.Middleware;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON serialization (camelCase)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add memory cache
builder.Services.AddSingleton<IMemoryCache, MemoryCache>();

// Register application services
builder.Services.AddSingleton<ICacheService, LruCacheService>();
builder.Services.AddSingleton<IRepoStorage, RepoStorage>();
builder.Services.AddScoped<IGitService, ForkWeb.Backend.Infrastructure.Git.GitService>();
builder.Services.AddScoped<IRepoService, RepoService>();

// Add logging
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
});

var app = builder.Build();

// Configure middleware pipeline
ExceptionHandlerMiddleware.UseCustomExceptionHandler(app);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Health check endpoint
app.MapGet("/api/health", (ICacheService cache) =>
{
    var stats = cache.GetStats();
    return Results.Ok(new
    {
        status = "ok",
        timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
        cache = new
        {
            size = stats.Size,
            maxSize = stats.MaxSize
        }
    });
}).WithTags("Health");

// Map API endpoints
app.MapReposEndpoints();
app.MapCommitsEndpoints();
app.MapBranchesEndpoints();
app.MapChangesEndpoints();

app.Run();
