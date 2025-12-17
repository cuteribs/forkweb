using System.Text.Json.Serialization;

namespace ForkWeb.Backend.Application.DTOs;

public record ApiResponse<T>(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("data")] T? Data = default,
    [property: JsonPropertyName("error")] ApiError? Error = null,
    [property: JsonPropertyName("timestamp")] long Timestamp = 0
);

public record ApiError(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("details")] object? Details = null
);

public record PaginatedResponse<T>(
    [property: JsonPropertyName("items")] List<T> Items,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("pageSize")] int PageSize,
    [property: JsonPropertyName("hasMore")] bool HasMore
);
