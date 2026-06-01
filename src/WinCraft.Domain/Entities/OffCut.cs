namespace WinCraft.Domain.Entities;

public class OffCut : TenantEntity
{
    public Guid ItemId { get; set; }
    public string? Code { get; set; }
    public int LengthMm { get; set; }
    public int Qty { get; set; } = 1;
    public string? JobRef { get; set; }
    public bool Usable { get; set; } = true;
    public DateTime Date { get; set; } = DateTime.UtcNow;

    public virtual InventoryItem Item { get; set; } = null!;
}
