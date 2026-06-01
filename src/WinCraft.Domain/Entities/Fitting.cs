namespace WinCraft.Domain.Entities;

public class Fitting : TenantEntity
{
    public string Code { get; set; } = "";
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public decimal UnitPrice { get; set; } = 0.000m;
    public int StockQty { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
