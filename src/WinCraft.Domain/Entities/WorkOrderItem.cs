namespace WinCraft.Domain.Entities;

public class WorkOrderItem : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public Guid? DesignId { get; set; }
    public string? Description { get; set; }
    public int Qty { get; set; } = 1;
    public string Status { get; set; } = "Pending";
    public string? QrCode { get; set; }

    public virtual WorkOrder WorkOrder { get; set; } = null!;
    public virtual Design? Design { get; set; }
}
