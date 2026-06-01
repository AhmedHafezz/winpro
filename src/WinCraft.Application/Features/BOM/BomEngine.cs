using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Shared.Helpers;

namespace WinCraft.Application.Features.BOM;

public class BomEngine(IApplicationDbContext db) : IBomEngine
{
    public async Task<BomResult> CalculateAsync(
        IEnumerable<Design> designs, Guid seriesId, CancellationToken ct = default)
    {
        var series = await db.ProfileSeries
            .Include(s => s.FrameProfile)
            .Include(s => s.SashProfile)
            .Include(s => s.MullionProfile)
            .Include(s => s.TransomProfile)
            .Include(s => s.BeadProfile)
            .Include(s => s.CleatProfile)
            .Include(s => s.ThresholdProfile)
            .FirstOrDefaultAsync(s => s.Id == seriesId, ct)
            ?? throw new KeyNotFoundException("السلسلة غير موجودة");

        var result = new BomResult();
        var designList = designs.ToList();

        foreach (var design in designList)
        {
            result.AllProfileCuts.AddRange(CalcProfileCuts(design, series));
            result.GlassPieces.AddRange(CalcGlassPieces(design, series));
        }

        result.OptimizedBars = result.AllProfileCuts
            .GroupBy(c => c.ProfileId)
            .Select(g => OptimizeProfile(g.Key, g.ToList()))
            .ToList();

        result.TotalBars     = result.OptimizedBars.Sum(p => p.BarCount);
        result.TotalLengthM  = result.OptimizedBars.Sum(p => Kwd.Round(p.BarCount * 6.0m));
        result.TotalWeightKg = result.OptimizedBars.Sum(p => p.TotalWeightKg);
        result.AvgUsagePct   = result.OptimizedBars.Count > 0
            ? result.OptimizedBars.Average(p => p.UsagePct) : 0;
        result.AvgRecoverPct = result.OptimizedBars.Count > 0
            ? result.OptimizedBars.Average(p => p.RecoverablePct) : 0;
        result.ScrapPct      = 100m - result.AvgUsagePct - result.AvgRecoverPct;

        return result;
    }

    private List<ProfileCut> CalcProfileCuts(Design d, ProfileSeries s)
    {
        var cuts = new List<ProfileCut>();
        int W = d.Width, H = d.Height;
        string treatment = BuildTreatmentString(d);

        if (s.FrameProfileId.HasValue)
            cuts.Add(new ProfileCut
            {
                ProfileId    = s.FrameProfileId.Value,
                ProfileCode  = s.FrameProfile?.Code ?? "",
                Description  = s.FrameProfile?.Description ?? "Frame",
                Lengths      = [W, W, H, H],
                AngleLeft    = 45, AngleRight = 45,
                TreatmentExt = treatment, TreatmentInt = treatment,
                Qty = d.Qty, DesignCode = d.Code,
                WeightPerM = s.FrameProfile?.WeightPerMeter ?? 0,
            });

        var panels = d.Panels.OrderBy(p => p.PanelIndex).ToList();

        if (s.SashProfileId.HasValue)
            foreach (var panel in panels)
            {
                int pW = (int)(panel.WidthRatio * W) - s.FrameThickness / 4;
                int pH = H - s.FrameThickness * 2;
                cuts.Add(new ProfileCut
                {
                    ProfileId    = s.SashProfileId.Value,
                    ProfileCode  = s.SashProfile?.Code ?? "",
                    Description  = s.SashProfile?.Description ?? "Sash",
                    Lengths      = [pW, pW, pH, pH],
                    AngleLeft    = 45, AngleRight = 45,
                    TreatmentExt = treatment, TreatmentInt = treatment,
                    Qty = d.Qty, DesignCode = d.Code,
                    WeightPerM = s.SashProfile?.WeightPerMeter ?? 0,
                });
            }

        if (s.MullionProfileId.HasValue && panels.Count > 1)
        {
            int mH = H - s.FrameThickness * 2;
            cuts.Add(new ProfileCut
            {
                ProfileId    = s.MullionProfileId.Value,
                ProfileCode  = s.MullionProfile?.Code ?? "",
                Description  = "Mullion",
                Lengths      = Enumerable.Repeat(mH, panels.Count - 1).ToArray(),
                AngleLeft    = 90, AngleRight = 90,
                TreatmentExt = treatment, TreatmentInt = treatment,
                Qty = d.Qty, DesignCode = d.Code,
                WeightPerM = s.MullionProfile?.WeightPerMeter ?? 0,
            });
        }

        if (s.TransomProfileId.HasValue && d.HasTransom)
        {
            int tW = W - s.FrameThickness * 2;
            cuts.Add(new ProfileCut
            {
                ProfileId    = s.TransomProfileId.Value,
                ProfileCode  = s.TransomProfile?.Code ?? "",
                Description  = "Transom M",
                Lengths      = [tW],
                AngleLeft    = 90, AngleRight = 90,
                TreatmentExt = treatment, TreatmentInt = treatment,
                Qty = d.Qty, DesignCode = d.Code,
                WeightPerM = s.TransomProfile?.WeightPerMeter ?? 0,
            });
        }

        if (s.BeadProfileId.HasValue)
            foreach (var panel in panels)
            {
                int gW = (int)(panel.WidthRatio * W)
                         - s.SashThickness * 2 - s.GlassRebate * 2;
                int gH = H - s.FrameThickness * 2
                         - s.SashThickness * 2 - s.GlassRebate * 2;
                cuts.Add(new ProfileCut
                {
                    ProfileId    = s.BeadProfileId.Value,
                    ProfileCode  = s.BeadProfile?.Code ?? "",
                    Description  = "Glazing Bead",
                    Lengths      = [gW, gW, gH, gH],
                    AngleLeft    = 45, AngleRight = 45,
                    TreatmentExt = treatment, TreatmentInt = treatment,
                    Qty = d.Qty, DesignCode = d.Code,
                    WeightPerM = s.BeadProfile?.WeightPerMeter ?? 0,
                });
            }

        if (s.CleatProfileId.HasValue)
            cuts.Add(new ProfileCut
            {
                ProfileId    = s.CleatProfileId.Value,
                ProfileCode  = s.CleatProfile?.Code ?? "",
                Description  = "Frame & Sash Crimping Corner Cleat",
                Lengths      = [46, 46, 46, 46],
                AngleLeft    = 90, AngleRight = 90,
                TreatmentExt = ",,", TreatmentInt = ",,",
                Qty = d.Qty, DesignCode = d.Code,
                WeightPerM = s.CleatProfile?.WeightPerMeter ?? 0,
            });

        return cuts;
    }

    private List<GlassPiece> CalcGlassPieces(Design d, ProfileSeries s)
    {
        var pieces = new List<GlassPiece>();
        var panels = d.Panels.OrderBy(p => p.PanelIndex).ToList();

        for (int i = 0; i < panels.Count; i++)
        {
            var panel = panels[i];
            int gW = (int)(panel.WidthRatio * d.Width)
                     - s.SashThickness * 2 - s.GlassRebate * 2;
            int gH = d.Height
                     - s.FrameThickness * 2 - s.SashThickness * 2 - s.GlassRebate * 2;
            decimal area  = Kwd.Round((decimal)(gW * gH) / 1_000_000m);
            decimal perim = Kwd.Round(2m * (gW + gH) / 1000m);
            pieces.Add(new GlassPiece
            {
                GlassTypeId    = panel.GlassTypeId ?? d.GlassTypeId ?? Guid.Empty,
                DesignCode     = d.Code,
                PanelRef       = $"Panel {i + 1}",
                WidthMm        = gW,
                HeightMm       = gH,
                Quantity       = d.Qty,
                AreaPerPiece   = area,
                TotalArea      = Kwd.Round(area * d.Qty),
                PerimeterM     = perim,
                TotalPerimeter = Kwd.Round(perim * d.Qty),
            });
        }
        return pieces;
    }

    private static OptimizedProfileResult OptimizeProfile(
        Guid profileId, List<ProfileCut> cuts,
        int barLength = 6000, int kerf = 3, int minRecoverable = 200)
    {
        var allLengths = cuts
            .SelectMany(c => Enumerable.Repeat(c.Lengths, c.Qty).SelectMany(l => l))
            .OrderByDescending(x => x)
            .ToList();

        var bars = new List<OptimizedBar>();
        foreach (var cut in allLengths)
        {
            var bar = bars.FirstOrDefault(b => b.Remaining >= cut + kerf);
            if (bar != null)
                bar.AddCut(cut, kerf);
            else
            {
                var newBar = new OptimizedBar(barLength);
                newBar.AddCut(cut, kerf);
                bars.Add(newBar);
            }
        }

        int totalUsed      = bars.Sum(b => barLength - b.Remaining);
        int totalBarLength = bars.Count * barLength;
        int recoverable    = bars.Where(b => b.Remaining >= minRecoverable).Sum(b => b.Remaining);
        int scrap          = bars.Where(b => b.Remaining > 0 && b.Remaining < minRecoverable).Sum(b => b.Remaining);

        var firstCut = cuts.FirstOrDefault();
        decimal wPerM  = firstCut?.WeightPerM ?? 0;
        decimal totalM = Kwd.Round(bars.Count * barLength / 1000m);

        return new OptimizedProfileResult
        {
            ProfileId      = profileId,
            ProfileCode    = firstCut?.ProfileCode ?? "",
            Description    = firstCut?.Description ?? "",
            TreatmentExt   = firstCut?.TreatmentExt ?? "",
            TreatmentInt   = firstCut?.TreatmentInt ?? "",
            Bars           = bars,
            BarCount       = bars.Count,
            BarLengthMm    = barLength,
            TotalLengthM   = totalM,
            TotalWeightKg  = Kwd.Round(totalM * wPerM),
            UsagePct       = totalBarLength > 0
                             ? Kwd.Round((decimal)totalUsed / totalBarLength * 100) : 0,
            RecoverablePct = totalBarLength > 0
                             ? Kwd.Round((decimal)recoverable / totalBarLength * 100) : 0,
            RecoverableMm  = recoverable,
            ScrapPct       = totalBarLength > 0
                             ? Kwd.Round((decimal)scrap / totalBarLength * 100) : 0,
            ScrapMm        = scrap,
        };
    }

    private static string BuildTreatmentString(Design d)
    {
        var finish = d.Finish?.Code ?? "";
        return $"{finish},,";
    }
}
