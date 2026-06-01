using WinCraft.Domain.Enums;

namespace WinCraft.Domain.Entities;

public class ProjectDocument : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string? Name { get; set; }
    public DocumentType Type { get; set; }
    public string? Url { get; set; }
    public int? SizeKb { get; set; }
    public string Status { get; set; } = "Pending";

    public virtual Project Project { get; set; } = null!;
}
