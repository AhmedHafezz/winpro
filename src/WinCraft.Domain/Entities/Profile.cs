namespace WinCraft.Domain.Entities;

public class Profile : BaseEntity
{
    public Guid SeriesId { get; set; }
    public string Code { get; set; } = "";
    public string? Description { get; set; }
    public string? DescriptionAr { get; set; }
    public string? Role { get; set; }
    public decimal? WeightPerMeter { get; set; }
    public int BarLength { get; set; } = 6000;
    public int MinCutLength { get; set; } = 100;
    public int CutAngleLeft { get; set; } = 45;
    public int CutAngleRight { get; set; } = 45;
    public string? SvgGeometry { get; set; }
    public string Alloy { get; set; } = "6063-T5";
    public bool IsActive { get; set; } = true;

    public virtual ProfileSeries Series { get; set; } = null!;
    public virtual ICollection<ProfileFinishPrice> FinishPrices { get; set; } = [];
}
