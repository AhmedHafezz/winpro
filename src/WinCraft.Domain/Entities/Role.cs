namespace WinCraft.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = "";
    public string? NameAr { get; set; }
    public string[] Permissions { get; set; } = [];

    public virtual ICollection<User> Users { get; set; } = [];
}
