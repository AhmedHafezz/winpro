using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class WorkOrder : TenantEntity
{
    public Guid? ProjectId { get; set; }
    public string Code { get; set; } = "";
    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Pending;
    public Priority Priority { get; set; } = Priority.Normal;
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public string? AssignedTeam { get; set; }
    public int ProgressPct { get; set; } = 0;
    public string? Notes { get; set; }

    public virtual Project? Project { get; set; }
    public virtual ICollection<WorkOrderItem> Items { get; set; } = [];
    public virtual ICollection<CutJob> CutJobs { get; set; } = [];
}
