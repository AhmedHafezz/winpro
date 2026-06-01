using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Quotation : TenantEntity
{
    public Guid CustomerId { get; set; }
    public string Code { get; set; } = "";
    public DateOnly? Date { get; set; }
    public DateOnly? ValidUntil { get; set; }
    public QuotationStatus Status { get; set; } = QuotationStatus.Draft;
    public decimal DiscountPct { get; set; } = 0.00m;
    public decimal TaxPct { get; set; } = 15.00m;
    public string? Notes { get; set; }
    public string? SmartLinkToken { get; set; }
    public int OpensCount { get; set; } = 0;
    public int RevisionNumber { get; set; } = 1;
    public decimal TotalValue { get; set; } = 0.000m;
    public Guid? AssignedUserId { get; set; }

    public virtual Customer Customer { get; set; } = null!;
    public virtual User? AssignedUser { get; set; }
    public virtual ICollection<Design> Designs { get; set; } = [];
}
