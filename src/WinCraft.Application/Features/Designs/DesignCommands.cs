using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WinCraft.Application.Common;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;

namespace WinCraft.Application.Features.Designs;

// ── DTOs ─────────────────────────────────────────────────────────────────────
public record DesignDto(
    Guid Id, Guid QuotationId, string? Name, Guid? SeriesId, string? SeriesName,
    double WidthMm, double HeightMm, int Qty, decimal UnitPrice, decimal TotalPrice,
    string? Notes, DateTime CreatedAt);

public record DesignDetailDto(
    Guid Id, Guid QuotationId, string? Name, Guid? SeriesId, string? SeriesName,
    double WidthMm, double HeightMm, int Qty, decimal UnitPrice, decimal TotalPrice,
    string? Notes, DateTime CreatedAt, List<DesignPanelDto> Panels);

public record DesignPanelDto(
    Guid Id, int PanelNo, string Type, double WidthRatio, double HeightRatio,
    Guid? GlassTypeId, string? GlassTypeName, Guid? FinishId, string? FinishName);

// ── Queries ───────────────────────────────────────────────────────────────────
public record GetDesignsByQuotationQuery(Guid QuotationId) : IRequest<List<DesignDto>>;
public record GetDesignQuery(Guid Id) : IRequest<DesignDetailDto>;

public class GetDesignsByQuotationHandler(IApplicationDbContext db)
    : IRequestHandler<GetDesignsByQuotationQuery, List<DesignDto>>
{
    public async Task<List<DesignDto>> Handle(GetDesignsByQuotationQuery q, CancellationToken ct)
        => await db.Designs
            .Include(d => d.Series)
            .Where(d => d.QuotationId == q.QuotationId && !d.IsDeleted)
            .OrderBy(d => d.CreatedAt)
            .Select(d => new DesignDto(
                d.Id, d.QuotationId, d.Name, d.SeriesId, d.Series != null ? d.Series.Name : null,
                d.WidthMm, d.HeightMm, d.Qty, d.UnitPrice, d.UnitPrice * d.Qty,
                d.Notes, d.CreatedAt))
            .ToListAsync(ct);
}

public class GetDesignHandler(IApplicationDbContext db)
    : IRequestHandler<GetDesignQuery, DesignDetailDto>
{
    public async Task<DesignDetailDto> Handle(GetDesignQuery q, CancellationToken ct)
    {
        var d = await db.Designs
            .Include(x => x.Series)
            .Include(x => x.Panels).ThenInclude(p => p.GlassType)
            .Include(x => x.Panels).ThenInclude(p => p.Finish)
            .FirstOrDefaultAsync(x => x.Id == q.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("التصميم غير موجود");

        return new DesignDetailDto(
            d.Id, d.QuotationId, d.Name, d.SeriesId,
            d.Series?.Name, d.WidthMm, d.HeightMm, d.Qty,
            d.UnitPrice, d.UnitPrice * d.Qty, d.Notes, d.CreatedAt,
            d.Panels.Select(p => new DesignPanelDto(
                p.Id, p.PanelNo, p.Type, p.WidthRatio, p.HeightRatio,
                p.GlassTypeId, p.GlassType?.Name, p.FinishId, p.Finish?.Name))
            .ToList());
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────
public record CreateDesignCommand(
    Guid QuotationId, string? Name, Guid? SeriesId,
    double WidthMm, double HeightMm, int Qty,
    decimal UnitPrice, string? Notes,
    List<CreatePanelDto>? Panels
) : IRequest<Guid>;

public record CreatePanelDto(
    int PanelNo, string Type, double WidthRatio, double HeightRatio,
    Guid? GlassTypeId, Guid? FinishId);

public class CreateDesignValidator : AbstractValidator<CreateDesignCommand>
{
    public CreateDesignValidator()
    {
        RuleFor(x => x.QuotationId).NotEmpty();
        RuleFor(x => x.WidthMm).GreaterThan(0);
        RuleFor(x => x.HeightMm).GreaterThan(0);
        RuleFor(x => x.Qty).GreaterThan(0);
        RuleFor(x => x.UnitPrice).GreaterThanOrEqualTo(0);
    }
}

public class CreateDesignHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<CreateDesignCommand, Guid>
{
    public async Task<Guid> Handle(CreateDesignCommand cmd, CancellationToken ct)
    {
        var design = new Design
        {
            TenantId    = tenant.Id,
            QuotationId = cmd.QuotationId,
            Name        = cmd.Name,
            SeriesId    = cmd.SeriesId,
            WidthMm     = cmd.WidthMm,
            HeightMm    = cmd.HeightMm,
            Qty         = cmd.Qty,
            UnitPrice   = cmd.UnitPrice,
            Notes       = cmd.Notes,
        };

        if (cmd.Panels?.Any() == true)
        {
            design.Panels = cmd.Panels.Select(p => new DesignPanel
            {
                TenantId    = tenant.Id,
                PanelNo     = p.PanelNo,
                Type        = p.Type,
                WidthRatio  = p.WidthRatio,
                HeightRatio = p.HeightRatio,
                GlassTypeId = p.GlassTypeId,
                FinishId    = p.FinishId,
            }).ToList();
        }

        await db.Designs.AddAsync(design, ct);

        // Recalculate quotation total
        var quotation = await db.Quotations
            .Include(q => q.Designs.Where(d => !d.IsDeleted))
            .FirstOrDefaultAsync(q => q.Id == cmd.QuotationId, ct);
        if (quotation != null)
        {
            quotation.Total = quotation.Designs.Sum(d => d.UnitPrice * d.Qty) + cmd.UnitPrice * cmd.Qty;
            quotation.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return design.Id;
    }
}

public record UpdateDesignCommand(
    Guid Id, string? Name, Guid? SeriesId,
    double WidthMm, double HeightMm, int Qty,
    decimal UnitPrice, string? Notes
) : IRequest;

public class UpdateDesignHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateDesignCommand>
{
    public async Task Handle(UpdateDesignCommand cmd, CancellationToken ct)
    {
        var d = await db.Designs.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("التصميم غير موجود");

        d.Name      = cmd.Name;
        d.SeriesId  = cmd.SeriesId;
        d.WidthMm   = cmd.WidthMm;
        d.HeightMm  = cmd.HeightMm;
        d.Qty       = cmd.Qty;
        d.UnitPrice = cmd.UnitPrice;
        d.Notes     = cmd.Notes;
        d.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}

public record DuplicateDesignCommand(Guid Id, int? NewQty) : IRequest<Guid>;

public class DuplicateDesignHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<DuplicateDesignCommand, Guid>
{
    public async Task<Guid> Handle(DuplicateDesignCommand cmd, CancellationToken ct)
    {
        var src = await db.Designs
            .Include(x => x.Panels)
            .FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("التصميم غير موجود");

        var copy = new Design
        {
            TenantId    = tenant.Id,
            QuotationId = src.QuotationId,
            Name        = src.Name != null ? src.Name + " (نسخة)" : null,
            SeriesId    = src.SeriesId,
            WidthMm     = src.WidthMm,
            HeightMm    = src.HeightMm,
            Qty         = cmd.NewQty ?? src.Qty,
            UnitPrice   = src.UnitPrice,
            Notes       = src.Notes,
            Panels = src.Panels.Select(p => new DesignPanel
            {
                TenantId    = tenant.Id,
                PanelNo     = p.PanelNo,
                Type        = p.Type,
                WidthRatio  = p.WidthRatio,
                HeightRatio = p.HeightRatio,
                GlassTypeId = p.GlassTypeId,
                FinishId    = p.FinishId,
            }).ToList(),
        };

        await db.Designs.AddAsync(copy, ct);
        await db.SaveChangesAsync(ct);
        return copy.Id;
    }
}

public record DeleteDesignCommand(Guid Id) : IRequest;

public class DeleteDesignHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteDesignCommand>
{
    public async Task Handle(DeleteDesignCommand cmd, CancellationToken ct)
    {
        var d = await db.Designs.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("التصميم غير موجود");
        d.IsDeleted = true;
        d.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
