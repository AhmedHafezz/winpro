using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Notification : TenantEntity
{
    public Guid? UserId { get; set; }
    public NotifType Type { get; set; }
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string? Module { get; set; }
    public Guid? EntityId { get; set; }
    public bool IsRead { get; set; } = false;

    public virtual User? User { get; set; }
}
