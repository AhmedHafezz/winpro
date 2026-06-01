namespace WinCraft.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = "";
    public string? Subdomain { get; set; }
    public string? LogoUrl { get; set; }
    public string Plan { get; set; } = "Starter";
    public DateTime? SubscriptionEnd { get; set; }
    public string Currency { get; set; } = "KWD";
    public int DecimalPlaces { get; set; } = 3;
    public decimal TaxRate { get; set; } = 15.00m;
    public string TaxLabel { get; set; } = "ضريبة القيمة المضافة";
    public bool IsActive { get; set; } = true;

    public virtual ICollection<User> Users { get; set; } = [];
}
