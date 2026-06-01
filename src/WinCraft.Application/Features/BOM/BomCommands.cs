using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;

namespace WinCraft.Application.Features.BOM;

public record CalculateBomCommand(Guid? QuotationId, Guid? ProjectId, Guid SeriesId) : IRequest<BomResultDto>;

public record BomResultDto(
    Guid BomId,
    int TotalBars, decimal TotalLengthM, decimal TotalWeightKg,
    decimal AvgUsagePct, decimal AvgRecoverPct, decimal ScrapPct,
    List<OptimizedBarDto> OptimizedBars,
    List<GlassPieceDto> GlassPieces);

public record OptimizedBarDto(
    string ProfileCode, string Description,
    string TreatmentExt, string TreatmentInt,
    int BarCount, decimal TotalLengthM, decimal TotalWeightKg,
    decimal UsagePct, decimal RecoverablePct, decimal ScrapPct,
    int RecoverableMm, int ScrapMm);

public record GlassPieceDto(
    string DesignCode, string PanelRef,
    int WidthMm, int HeightMm, int Quantity,
    decimal AreaPerPiece, decimal TotalArea,
    decimal PerimeterM, decimal TotalPerimeter);

public class CalculateBomHandler(IApplicationDbContext db, IBomEngine engine, ICurrentTenant tenant)
    : IRequestHandler<CalculateBomCommand, BomResultDto>
{
    public async Task<BomResultDto> Handle(CalculateBomCommand cmd, CancellationToken ct)
    {
        IQueryable<Design> query = db.Designs.Include(d => d.Panels).Include(d => d.Finish);
        if (cmd.QuotationId.HasValue)
            query = query.Where(d => d.QuotationId == cmd.QuotationId);
        else if (cmd.ProjectId.HasValue)
            query = query.Where(d => d.ProjectId == cmd.ProjectId);
        else
            throw new ArgumentException("QuotationId or ProjectId required");

        var designs = await query.Where(d => !d.IsDeleted).ToListAsync(ct);
        if (designs.Count == 0)
            throw new InvalidOperationException("لا يوجد تصاميم للحساب");

        var result = await engine.CalculateAsync(designs, cmd.SeriesId, ct);

        var bom = new BomCalculation
        {
            TenantId     = tenant.Id,
            QuotationId  = cmd.QuotationId,
            ProjectId    = cmd.ProjectId,
            TotalBars    = result.TotalBars,
            TotalLengthM = result.TotalLengthM,
            TotalWeightKg = result.TotalWeightKg,
            UsagePct     = result.AvgUsagePct,
            RecoverablePct = result.AvgRecoverPct,
            ScrapPct     = result.ScrapPct,
            ResultJson   = JsonSerializer.Serialize(result),
        };
        await db.BomCalculations.AddAsync(bom, ct);
        await db.SaveChangesAsync(ct);

        return new BomResultDto(
            bom.Id,
            result.TotalBars, result.TotalLengthM, result.TotalWeightKg,
            result.AvgUsagePct, result.AvgRecoverPct, result.ScrapPct,
            result.OptimizedBars.Select(b => new OptimizedBarDto(
                b.ProfileCode, b.Description, b.TreatmentExt, b.TreatmentInt,
                b.BarCount, b.TotalLengthM, b.TotalWeightKg,
                b.UsagePct, b.RecoverablePct, b.ScrapPct,
                b.RecoverableMm, b.ScrapMm)).ToList(),
            result.GlassPieces.Select(g => new GlassPieceDto(
                g.DesignCode, g.PanelRef, g.WidthMm, g.HeightMm, g.Quantity,
                g.AreaPerPiece, g.TotalArea, g.PerimeterM, g.TotalPerimeter)).ToList());
    }
}

public record GetBomQuery(Guid BomId) : IRequest<BomResultDto>;

public class GetBomHandler(IApplicationDbContext db)
    : IRequestHandler<GetBomQuery, BomResultDto>
{
    public async Task<BomResultDto> Handle(GetBomQuery q, CancellationToken ct)
    {
        var bom = await db.BomCalculations.FindAsync([q.BomId], ct)
            ?? throw new KeyNotFoundException("BOM غير موجود");

        var result = bom.ResultJson != null
            ? JsonSerializer.Deserialize<BomResult>(bom.ResultJson)!
            : new BomResult();

        return new BomResultDto(
            bom.Id,
            bom.TotalBars, bom.TotalLengthM, bom.TotalWeightKg,
            bom.UsagePct, bom.RecoverablePct, bom.ScrapPct,
            result.OptimizedBars.Select(b => new OptimizedBarDto(
                b.ProfileCode, b.Description, b.TreatmentExt, b.TreatmentInt,
                b.BarCount, b.TotalLengthM, b.TotalWeightKg,
                b.UsagePct, b.RecoverablePct, b.ScrapPct,
                b.RecoverableMm, b.ScrapMm)).ToList(),
            result.GlassPieces.Select(g => new GlassPieceDto(
                g.DesignCode, g.PanelRef, g.WidthMm, g.HeightMm, g.Quantity,
                g.AreaPerPiece, g.TotalArea, g.PerimeterM, g.TotalPerimeter)).ToList());
    }
}
