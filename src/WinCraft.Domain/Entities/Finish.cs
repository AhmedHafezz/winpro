namespace WinCraft.Domain.Entities;

public class Finish : BaseEntity
{
    public string Code { get; set; } = "";
    public string? Name { get; set; }
    public string? NameAr { get; set; }
    public string? HexColor { get; set; }
    public decimal PremiumPct { get; set; } = 0.00m;
}
