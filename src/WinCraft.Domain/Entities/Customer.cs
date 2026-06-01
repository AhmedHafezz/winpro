using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class Customer : TenantEntity
{
    public string Name { get; set; } = "";
    public CustomerType Type { get; set; } = CustomerType.Company;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public CustomerStatus Status { get; set; } = CustomerStatus.Active;
    public string? Notes { get; set; }

    public virtual ICollection<Deal> Deals { get; set; } = [];
    public virtual ICollection<Activity> Activities { get; set; } = [];
    public virtual ICollection<Quotation> Quotations { get; set; } = [];
}
