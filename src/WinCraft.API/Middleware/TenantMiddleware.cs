using WinCraft.Application.Common.Interfaces;

namespace WinCraft.API.Middleware;

public class TenantMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, ICurrentTenant tenant)
    {
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            var tid = ctx.User.FindFirst("tenant_id")?.Value;
            if (Guid.TryParse(tid, out var tenantId))
                tenant.Set(tenantId);
        }
        await next(ctx);
    }
}
