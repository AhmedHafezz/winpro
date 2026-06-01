namespace WinCraft.Domain.Entities;

public class Design : TenantEntity
{
    public Guid? QuotationId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Code { get; set; } = "";
    public string? TemplateId { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public int Qty { get; set; } = 1;
    public Guid? SeriesId { get; set; }
    public Guid? GlassTypeId { get; set; }
    public Guid? FinishId { get; set; }
    public string? WindowType { get; set; }
    public string? Location { get; set; }
    public int FloorNumber { get; set; } = 1;
    public bool HasTransom { get; set; } = false;
    public string? Notes { get; set; }

    public virtual Quotation? Quotation { get; set; }
    public virtual ProfileSeries? Series { get; set; }
    public virtual GlassType? GlassType { get; set; }
    public virtual Finish? Finish { get; set; }
    public virtual Treatment? Treatment { get; set; }
    public virtual ICollection<DesignPanel> Panels { get; set; } = [];
}
