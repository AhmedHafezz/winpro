using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class StockMovement : TenantEntity
{
    public Guid ItemId { get; set; }
    public MovementType Type { get; set; }
    public decimal Qty { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? Reference { get; set; }
    public string? Note { get; set; }
    public Guid? UserId { get; set; }

    public virtual InventoryItem Item { get; set; } = null!;
    public virtual User? User { get; set; }
}
