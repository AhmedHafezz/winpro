namespace WinCraft.Domain.Entities;

public class InventoryItem : TenantEntity
{
    public string Code { get; set; } = "";
    public string? Name { get; set; }
    public string? NameAr { get; set; }
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public decimal Price { get; set; } = 0.000m;
    public decimal MinStock { get; set; } = 0;
    public decimal CurrentStock { get; set; } = 0;
    public string? Location { get; set; }
    public Guid? SeriesId { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ProfileSeries? Series { get; set; }
    public virtual ICollection<StockMovement> Movements { get; set; } = [];
}
