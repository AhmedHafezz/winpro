using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class InstallationJob : TenantEntity
{
    public Guid? ProjectId { get; set; }
    public string? TeamLead { get; set; }
    public DateOnly? ScheduledDate { get; set; }
    public InstallStatus Status { get; set; } = InstallStatus.Scheduled;
    public string[] ChecklistJson { get; set; } = [];
    public string? Notes { get; set; }

    public virtual Project? Project { get; set; }
}
