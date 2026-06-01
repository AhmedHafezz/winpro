namespace WinCraft.Domain.Entities;

public class SurveyItem : BaseEntity
{
    public Guid SurveyId { get; set; }
    public string? Location { get; set; }
    public int FloorNumber { get; set; } = 1;
    public int? WidthMm { get; set; }
    public int? HeightMm { get; set; }
    public string? OpeningType { get; set; }
    public string? Notes { get; set; }
    public string? PhotoUrl { get; set; }

    public virtual Survey Survey { get; set; } = null!;
}
