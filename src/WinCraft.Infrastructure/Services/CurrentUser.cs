using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using WinCraft.Application.Common.Interfaces;

namespace WinCraft.Infrastructure.Services;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public Guid Id => Guid.TryParse(Principal?.FindFirstValue("sub"), out var id) ? id : Guid.Empty;
    public Guid TenantId => Guid.TryParse(Principal?.FindFirstValue("tenant_id"), out var tid) ? tid : Guid.Empty;
    public string Email => Principal?.FindFirstValue("email") ?? "";
    public string Name => Principal?.FindFirstValue("name") ?? "";
    public string Role => Principal?.FindFirstValue("role") ?? "";
    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public string[] Permissions
    {
        get
        {
            var raw = Principal?.FindFirstValue("permissions");
            if (string.IsNullOrEmpty(raw)) return [];
            return JsonSerializer.Deserialize<string[]>(raw) ?? [];
        }
    }

    public bool HasPermission(string permission)
    {
        if (Permissions.Contains("admin.*")) return true;
        if (Permissions.Contains(permission)) return true;
        var prefix = permission.Split('.')[0];
        return Permissions.Contains($"{prefix}.*");
    }
}
