namespace WinCraft.Domain.Entities;

public class User : TenantEntity
{
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string? Phone { get; set; }
    public Guid? RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public virtual Role? Role { get; set; }
    public virtual Tenant Tenant { get; set; } = null!;
}
