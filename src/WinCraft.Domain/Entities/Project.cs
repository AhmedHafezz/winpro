using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Project : TenantEntity
{
    public Guid? QuotationId { get; set; }
    public Guid? CustomerId { get; set; }
    public string Name { get; set; } = "";
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public Guid? AssignedUserId { get; set; }
    public DateOnly? DueDate { get; set; }
    public int RevisionNumber { get; set; } = 1;
    public string? Notes { get; set; }

    public virtual Quotation? Quotation { get; set; }
    public virtual Customer? Customer { get; set; }
    public virtual User? AssignedUser { get; set; }
    public virtual ICollection<WorkOrder> WorkOrders { get; set; } = [];
    public virtual ICollection<Payment> Payments { get; set; } = [];
    public virtual ICollection<ProjectDocument> Documents { get; set; } = [];
}
