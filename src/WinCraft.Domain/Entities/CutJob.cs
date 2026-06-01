namespace WinCraft.Domain.Entities;

public class CutJob : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public Guid? ProfileId { get; set; }
    public string? ProfileCode { get; set; }
    public int BarLengthMm { get; set; } = 6000;
    public int KerfMm { get; set; } = 3;
    public string? CutsJson { get; set; }
    public string? BarsJson { get; set; }
    public decimal EfficiencyPct { get; set; }
    public int WasteMm { get; set; }

    public virtual WorkOrder WorkOrder { get; set; } = null!;
    public virtual Profile? Profile { get; set; }
}
