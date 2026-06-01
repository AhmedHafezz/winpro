using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Deal : TenantEntity
{
    public Guid CustomerId { get; set; }
    public Guid? AssignedUserId { get; set; }
    public string Title { get; set; } = "";
    public decimal Value { get; set; } = 0.000m;
    public DealStage Stage { get; set; } = DealStage.Initial;
    public int ProbabilityPct { get; set; } = 30;
    public DateOnly? DueDate { get; set; }
    public string? Notes { get; set; }

    public virtual Customer Customer { get; set; } = null!;
    public virtual User? AssignedUser { get; set; }
    public virtual ICollection<Activity> Activities { get; set; } = [];
}
