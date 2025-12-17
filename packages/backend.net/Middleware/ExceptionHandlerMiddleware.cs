using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace ForkWeb.Backend.Middleware;

public class ExceptionHandlerMiddleware
{
    public static IApplicationBuilder UseCustomExceptionHandler(IApplicationBuilder app)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var exceptionHandlerFeature = context.Features.Get<IExceptionHandlerFeature>();
                var exception = exceptionHandlerFeature?.Error;

                var problemDetails = exception switch
                {
                    DirectoryNotFoundException => new ProblemDetails
                    {
                        Status = (int)HttpStatusCode.NotFound,
                        Title = "Directory Not Found",
                        Detail = exception.Message,
                        Type = "DIRECTORY_NOT_FOUND"
                    },
                    KeyNotFoundException => new ProblemDetails
                    {
                        Status = (int)HttpStatusCode.NotFound,
                        Title = "Not Found",
                        Detail = exception.Message,
                        Type = "NOT_FOUND"
                    },
                    InvalidOperationException => new ProblemDetails
                    {
                        Status = (int)HttpStatusCode.BadRequest,
                        Title = "Invalid Operation",
                        Detail = exception.Message,
                        Type = "INVALID_OPERATION"
                    },
                    _ => new ProblemDetails
                    {
                        Status = (int)HttpStatusCode.InternalServerError,
                        Title = "Internal Server Error",
                        Detail = exception?.Message ?? "An unexpected error occurred",
                        Type = "INTERNAL_ERROR"
                    }
                };

                context.Response.StatusCode = problemDetails.Status ?? 500;
                context.Response.ContentType = "application/problem+json";

                await context.Response.WriteAsJsonAsync(problemDetails);
            });
        });

        return app;
    }
}
