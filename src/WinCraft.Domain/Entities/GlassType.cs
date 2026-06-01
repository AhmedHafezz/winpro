namespace WinCraft.Domain.Entities;

public class GlassType : TenantEntity
{
    public string Code { get; set; } = "";
    public string? Name { get; set; }
    public string? Composition { get; set; }
    public decimal? TotalThickness { get; set; }
    public decimal? UValue { get; set; }
    public decimal PricePerSqm { get; set; } = 0.000m;
    public decimal? WeightPerSqm { get; set; }
    public string? TintColor { get; set; }
    public bool IsToughened { get; set; } = false;
    public bool IsLowE { get; set; } = false;
    public bool IsActive { get; set; } = true;
}
