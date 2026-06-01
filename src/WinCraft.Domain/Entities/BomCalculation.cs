namespace WinCraft.Domain.Entities;

public class BomCalculation : TenantEntity
{
    public Guid? QuotationId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public int TotalBars { get; set; } = 0;
    public decimal TotalLengthM { get; set; } = 0.000m;
    public decimal TotalWeightKg { get; set; } = 0.000m;
    public decimal UsagePct { get; set; } = 0.00m;
    public decimal RecoverablePct { get; set; } = 0.00m;
    public decimal ScrapPct { get; set; } = 0.00m;
    public decimal ProfilesCost { get; set; } = 0.000m;
    public decimal GlassCost { get; set; } = 0.000m;
    public decimal FittingsCost { get; set; } = 0.000m;
    public decimal TotalCost { get; set; } = 0.000m;
    public string? ResultJson { get; set; }
}
