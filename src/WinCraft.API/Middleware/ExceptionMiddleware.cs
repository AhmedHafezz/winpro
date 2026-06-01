using System.Text.Json;
using FluentValidation;

namespace WinCraft.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await HandleExceptionAsync(ctx, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext ctx, Exception ex)
    {
        ctx.Response.ContentType = "application/json";

        var (status, message) = ex switch
        {
            ValidationException ve => (400, string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))),
            UnauthorizedAccessException => (401, ex.Message),
            KeyNotFoundException => (404, ex.Message),
            InvalidOperationException => (422, ex.Message),
            _ => (500, "حدث خطأ داخلي، يرجى المحاولة لاحقاً")
        };

        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { error = message, status }));
    }
}
