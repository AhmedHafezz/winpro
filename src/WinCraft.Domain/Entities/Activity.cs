using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Activity : TenantEntity
{
    public Guid? CustomerId { get; set; }
    public Guid? DealId { get; set; }
    public ActivityType Type { get; set; }
    public string? Title { get; set; }
    public DateOnly? Date { get; set; }
    public bool Done { get; set; } = false;
    public string? Notes { get; set; }
    public Guid? UserId { get; set; }

    public virtual Customer? Customer { get; set; }
    public virtual Deal? Deal { get; set; }
    public virtual User? User { get; set; }
}
