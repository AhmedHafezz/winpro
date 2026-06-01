namespace WinCraft.Domain.Entities;

public class ProfileSeries : TenantEntity
{
    public string Code { get; set; } = "";
    public string? Name { get; set; }
    public string? Manufacturer { get; set; }
    public string? SystemType { get; set; }
    public int? NominalWidth { get; set; }
    public Guid? FrameProfileId { get; set; }
    public Guid? SashProfileId { get; set; }
    public Guid? MullionProfileId { get; set; }
    public Guid? TransomProfileId { get; set; }
    public Guid? BeadProfileId { get; set; }
    public Guid? CleatProfileId { get; set; }
    public Guid? ThresholdProfileId { get; set; }
    public int FrameThickness { get; set; } = 142;
    public int SashThickness { get; set; } = 82;
    public int GlassRebate { get; set; } = 18;
    public decimal LaborRatePerSqm { get; set; } = 0.000m;
    public bool IsActive { get; set; } = true;

    public virtual Profile? FrameProfile { get; set; }
    public virtual Profile? SashProfile { get; set; }
    public virtual Profile? MullionProfile { get; set; }
    public virtual Profile? TransomProfile { get; set; }
    public virtual Profile? BeadProfile { get; set; }
    public virtual Profile? CleatProfile { get; set; }
    public virtual Profile? ThresholdProfile { get; set; }
    public virtual ICollection<Profile> Profiles { get; set; } = [];
    public virtual ICollection<FittingsKit> FittingsKits { get; set; } = [];
}
