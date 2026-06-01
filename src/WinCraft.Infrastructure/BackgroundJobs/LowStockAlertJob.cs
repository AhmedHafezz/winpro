using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Infrastructure.BackgroundJobs;

public class LowStockAlertJob(IApplicationDbContext db, INotificationService notifs, ILogger<LowStockAlertJob> logger)
{
    public async Task ExecuteAsync()
    {
        var lowStockItems = await db.InventoryItems
            .Where(i => i.IsActive && i.CurrentStock <= i.MinStock && i.MinStock > 0)
            .ToListAsync();

        foreach (var item in lowStockItems)
        {
            logger.LogInformation("Low stock: {Code} — {Current}/{Min}", item.Code, item.CurrentStock, item.MinStock);
            await notifs.BroadcastToTenantAsync(item.TenantId, new Notification
            {
                TenantId = item.TenantId,
                Type     = NotifType.LowStock,
                Title    = "تنبيه: مخزون منخفض",
                Message  = $"الصنف {item.Code} وصل إلى الحد الأدنى ({item.CurrentStock} {item.Unit})",
                Module   = "inventory",
                EntityId = item.Id,
            });
        }
    }
}
