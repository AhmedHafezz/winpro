using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ProfilesController(IApplicationDbContext db) : ControllerBase
{
    [HttpGet("profiles")]
    public async Task<IActionResult> GetProfiles([FromQuery] Guid? seriesId, CancellationToken ct)
    {
        var query = db.Profiles.Where(p => p.IsActive);
        if (seriesId.HasValue) query = query.Where(p => p.SeriesId == seriesId);
        var profiles = await query.Select(p => new
        {
            p.Id, p.Code, p.Description, p.Role,
            p.WeightPerMeter, p.BarLength, p.CutAngleLeft, p.CutAngleRight,
            p.SvgGeometry, p.Alloy,
        }).ToListAsync(ct);
        return Ok(profiles);
    }

    [HttpGet("profiles/{id:guid}")]
    public async Task<IActionResult> GetProfile(Guid id, CancellationToken ct)
    {
        var p = await db.Profiles.FindAsync([id], ct);
        return p == null ? NotFound() : Ok(p);
    }

    [HttpGet("profile-series")]
    public async Task<IActionResult> GetSeries(CancellationToken ct)
    {
        var series = await db.ProfileSeries
            .Where(s => s.IsActive)
            .Select(s => new
            {
                s.Id, s.Code, s.Name, s.Manufacturer, s.SystemType,
                s.NominalWidth, s.FrameThickness, s.SashThickness, s.GlassRebate,
            }).ToListAsync(ct);
        return Ok(series);
    }

    [HttpGet("glass-types")]
    public async Task<IActionResult> GetGlassTypes(CancellationToken ct)
    {
        var types = await db.GlassTypes
            .Where(g => g.IsActive)
            .Select(g => new
            {
                g.Id, g.Code, g.Name, g.Composition, g.TotalThickness,
                g.UValue, g.PricePerSqm, g.TintColor, g.IsToughened, g.IsLowE,
            }).ToListAsync(ct);
        return Ok(types);
    }

    [HttpGet("finishes")]
    public async Task<IActionResult> GetFinishes(CancellationToken ct)
        => Ok(await db.Finishes.ToListAsync(ct));

    [HttpGet("fittings-kits/{seriesId:guid}/{windowType}")]
    public async Task<IActionResult> GetFittingsKit(Guid seriesId, string windowType, CancellationToken ct)
    {
        var kit = await db.FittingsKits
            .FirstOrDefaultAsync(k => k.SeriesId == seriesId && k.WindowType == windowType, ct);
        return kit == null ? NotFound() : Ok(kit);
    }
}
