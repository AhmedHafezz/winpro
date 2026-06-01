using Microsoft.AspNetCore.SignalR;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Infrastructure.Hubs;

namespace WinCraft.Infrastructure.Services;

public class NotificationService(
    IApplicationDbContext db,
    IHubContext<NotificationHub> hub)
    : INotificationService
{
    public async Task SendAsync(Guid tenantId, Guid? userId, Notification notification, CancellationToken ct = default)
    {
        notification.TenantId = tenantId;
        notification.UserId   = userId;
        await db.Notifications.AddAsync(notification, ct);
        await db.SaveChangesAsync(ct);

        var payload = new
        {
            notification.Id,
            Type    = notification.Type.ToString(),
            notification.Title,
            notification.Message,
            notification.Module,
            notification.EntityId,
            CreatedAt = notification.CreatedAt,
        };

        if (userId.HasValue)
            await hub.Clients.Group($"user_{userId}").SendAsync("notification", payload, ct);
        else
            await hub.Clients.Group($"tenant_{tenantId}").SendAsync("notification", payload, ct);
    }

    public async Task BroadcastToTenantAsync(Guid tenantId, Notification notification, CancellationToken ct = default)
        => await SendAsync(tenantId, null, notification, ct);
}
