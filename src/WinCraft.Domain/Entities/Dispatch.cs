using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Dispatch : TenantEntity
{
    public Guid? ProjectId { get; set; }
    public DateOnly? ScheduledDate { get; set; }
    public DispatchStatus Status { get; set; } = DispatchStatus.Scheduled;
    public string? DriverName { get; set; }
    public string? Notes { get; set; }

    public virtual Project? Project { get; set; }
}
