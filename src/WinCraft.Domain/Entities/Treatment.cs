namespace WinCraft.Domain.Entities;

public class Treatment : BaseEntity
{
    public Guid DesignId { get; set; }
    public string? ProfileFinish { get; set; }
    public string? ProfileColor { get; set; }
    public string? ProfileRalCode { get; set; }
    public string? FittingsFinish { get; set; }
    public Guid? GlassTypeId { get; set; }
    public decimal? UValueCalc { get; set; }

    public virtual Design Design { get; set; } = null!;
    public virtual GlassType? GlassType { get; set; }
}
