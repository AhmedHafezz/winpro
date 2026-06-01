namespace WinCraft.Domain.Entities;

public class FittingsKit : BaseEntity
{
    public Guid SeriesId { get; set; }
    public string? WindowType { get; set; }
    public FittingsKitItem[] Items { get; set; } = [];

    public virtual ProfileSeries Series { get; set; } = null!;
}

public class FittingsKitItem
{
    public string FittingCode { get; set; } = "";
    public decimal Qty { get; set; }
    public string? Formula { get; set; }
    public string? Condition { get; set; }
    public string? TreatmentCode { get; set; }
}
