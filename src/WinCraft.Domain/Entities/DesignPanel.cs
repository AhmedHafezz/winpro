namespace WinCraft.Domain.Entities;

public class DesignPanel : BaseEntity
{
    public Guid DesignId { get; set; }
    public int PanelIndex { get; set; }
    public string? Type { get; set; }
    public decimal WidthRatio { get; set; }
    public Guid? GlassTypeId { get; set; }

    public virtual Design Design { get; set; } = null!;
    public virtual GlassType? GlassType { get; set; }
}
