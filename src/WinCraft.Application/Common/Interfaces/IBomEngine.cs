using WinCraft.Domain.Entities;

namespace WinCraft.Application.Common.Interfaces;

public interface IBomEngine
{
    Task<BomResult> CalculateAsync(IEnumerable<Design> designs, Guid seriesId, CancellationToken ct = default);
}

public class BomResult
{
    public List<ProfileCut> AllProfileCuts { get; set; } = [];
    public List<GlassPiece> GlassPieces { get; set; } = [];
    public List<FittingItem> FittingItems { get; set; } = [];
    public List<OptimizedProfileResult> OptimizedBars { get; set; } = [];
    public int TotalBars { get; set; }
    public decimal TotalLengthM { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal AvgUsagePct { get; set; }
    public decimal AvgRecoverPct { get; set; }
    public decimal ScrapPct { get; set; }
}

public class ProfileCut
{
    public Guid ProfileId { get; set; }
    public string ProfileCode { get; set; } = "";
    public string Description { get; set; } = "";
    public int[] Lengths { get; set; } = [];
    public int AngleLeft { get; set; } = 45;
    public int AngleRight { get; set; } = 45;
    public string TreatmentExt { get; set; } = "";
    public string TreatmentInt { get; set; } = "";
    public int Qty { get; set; } = 1;
    public string DesignCode { get; set; } = "";
    public decimal WeightPerM { get; set; }
}

public class GlassPiece
{
    public Guid GlassTypeId { get; set; }
    public string DesignCode { get; set; } = "";
    public string PanelRef { get; set; } = "";
    public int WidthMm { get; set; }
    public int HeightMm { get; set; }
    public int Quantity { get; set; }
    public decimal AreaPerPiece { get; set; }
    public decimal TotalArea { get; set; }
    public decimal PerimeterM { get; set; }
    public decimal TotalPerimeter { get; set; }
}

public class FittingItem
{
    public string FittingCode { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public decimal Qty { get; set; }
    public string Unit { get; set; } = "";
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}

public class OptimizedProfileResult
{
    public Guid ProfileId { get; set; }
    public string ProfileCode { get; set; } = "";
    public string Description { get; set; } = "";
    public string TreatmentExt { get; set; } = "";
    public string TreatmentInt { get; set; } = "";
    public List<OptimizedBar> Bars { get; set; } = [];
    public int BarCount { get; set; }
    public int BarLengthMm { get; set; } = 6000;
    public decimal TotalLengthM { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal UsagePct { get; set; }
    public decimal RecoverablePct { get; set; }
    public int RecoverableMm { get; set; }
    public decimal ScrapPct { get; set; }
    public int ScrapMm { get; set; }
}

public class OptimizedBar
{
    private readonly int _barLength;
    public List<int> Cuts { get; } = [];
    public int Remaining { get; private set; }
    public bool IsRecoverable => Remaining >= 200;

    public OptimizedBar(int barLength)
    {
        _barLength = barLength;
        Remaining  = barLength;
    }

    public void AddCut(int length, int kerf)
    {
        Cuts.Add(length);
        Remaining -= (length + kerf);
    }
}
