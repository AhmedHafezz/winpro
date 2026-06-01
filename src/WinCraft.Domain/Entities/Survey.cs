using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Survey : TenantEntity
{
    public Guid? CustomerId { get; set; }
    public Guid? AssignedTo { get; set; }
    public string? ProjectName { get; set; }
    public string? Address { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public SurveyStatus Status { get; set; } = SurveyStatus.Pending;
    public DateOnly? SurveyDate { get; set; }
    public string? Notes { get; set; }

    public virtual Customer? Customer { get; set; }
    public virtual User? AssignedUser { get; set; }
    public virtual ICollection<SurveyItem> Items { get; set; } = [];
}
