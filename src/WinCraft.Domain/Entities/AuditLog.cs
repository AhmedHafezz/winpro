namespace WinCraft.Domain.Entities;

public class AuditLog : TenantEntity
{
    public Guid? UserId { get; set; }
    public string? Action { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? ChangesJson { get; set; }

    public virtual User? User { get; set; }
}
