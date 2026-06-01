using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WinCraft.Infrastructure.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId   = Context.User?.FindFirst("sub")?.Value;
        var tenantId = Context.User?.FindFirst("tenant_id")?.Value;

        if (userId != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        if (tenantId != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");

        await base.OnConnectedAsync();
    }
}
