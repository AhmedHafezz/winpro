namespace WinCraft.Domain.Entities;

public class ProfileFinishPrice : BaseEntity
{
    public Guid ProfileId { get; set; }
    public string FinishCode { get; set; } = "";
    public decimal PricePerMeter { get; set; } = 0.000m;

    public virtual Profile Profile { get; set; } = null!;
}
