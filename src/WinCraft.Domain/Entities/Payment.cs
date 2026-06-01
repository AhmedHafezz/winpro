using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Payment : TenantEntity
{
    public Guid ProjectId { get; set; }
    public string? Description { get; set; }
    public decimal Amount { get; set; } = 0.000m;
    public DateOnly? DueDate { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime? ReceivedAt { get; set; }
    public string? Notes { get; set; }

    public virtual Project Project { get; set; } = null!;
}
