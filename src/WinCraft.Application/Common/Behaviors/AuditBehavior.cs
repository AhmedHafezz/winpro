using MediatR;
using Microsoft.Extensions.Logging;
using WinCraft.Application.Common.Interfaces;

namespace WinCraft.Application.Common.Behaviors;

public class AuditBehavior<TRequest, TResponse>(
    ICurrentUser currentUser,
    IApplicationDbContext db,
    ILogger<AuditBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var requestName = typeof(TRequest).Name;
        logger.LogInformation("WinCraft Request: {Name} by {User}", requestName,
            currentUser.IsAuthenticated ? currentUser.Email : "anonymous");

        var response = await next();
        return response;
    }
}
