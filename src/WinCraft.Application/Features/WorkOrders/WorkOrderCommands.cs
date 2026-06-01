using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Application.Features.WorkOrders;

// ── DTOs ─────────────────────────────────────────────────────────────────────
public record WorkOrderDto(
    Guid Id, string Code, Guid? ProjectId, string? ProjectName,
    string Status, string Priority, int ProgressPct,
    DateOnly? StartDate, DateOnly? DueDate, string? AssignedTeam,
    string? Notes, DateTime CreatedAt);

// ── Queries ───────────────────────────────────────────────────────────────────
public record GetWorkOrdersQuery(
    string? Status = null, Guid? ProjectId = null,
    int Page = 1, int PageSize = 20
) : IRequest<PagedResult<WorkOrderDto>>;

public record GetWorkOrderQuery(Guid Id) : IRequest<WorkOrderDto>;

public class GetWorkOrdersHandler(IApplicationDbContext db)
    : IRequestHandler<GetWorkOrdersQuery, PagedResult<WorkOrderDto>>
{
    public async Task<PagedResult<WorkOrderDto>> Handle(GetWorkOrdersQuery q, CancellationToken ct)
    {
        var query = db.WorkOrders
            .Include(w => w.Project)
            .Where(w => !w.IsDeleted);
        if (!string.IsNullOrEmpty(q.Status)) query = query.Where(w => w.Status.ToString() == q.Status);
        if (q.ProjectId.HasValue) query = query.Where(w => w.ProjectId == q.ProjectId);

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(w => w.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize).Take(q.PageSize)
            .Select(w => new WorkOrderDto(
                w.Id, w.Code, w.ProjectId, w.Project != null ? w.Project.Name : null,
                w.Status.ToString(), w.Priority.ToString(), w.ProgressPct,
                w.StartDate, w.DueDate, w.AssignedTeam, w.Notes, w.CreatedAt))
            .ToListAsync(ct);
        return new PagedResult<WorkOrderDto>(items, total, q.Page, q.PageSize);
    }
}

public class GetWorkOrderHandler(IApplicationDbContext db)
    : IRequestHandler<GetWorkOrderQuery, WorkOrderDto>
{
    public async Task<WorkOrderDto> Handle(GetWorkOrderQuery q, CancellationToken ct)
    {
        var w = await db.WorkOrders.Include(x => x.Project)
            .FirstOrDefaultAsync(x => x.Id == q.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("أمر التصنيع غير موجود");
        return new WorkOrderDto(w.Id, w.Code, w.ProjectId, w.Project?.Name,
            w.Status.ToString(), w.Priority.ToString(), w.ProgressPct,
            w.StartDate, w.DueDate, w.AssignedTeam, w.Notes, w.CreatedAt);
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────
public record CreateWorkOrderCommand(
    Guid? ProjectId, DateOnly? StartDate, DateOnly? DueDate,
    string Priority, string? AssignedTeam, string? Notes
) : IRequest<Guid>;

public class CreateWorkOrderValidator : AbstractValidator<CreateWorkOrderCommand>
{
    public CreateWorkOrderValidator()
    {
        RuleFor(x => x.Priority).IsEnumName(typeof(Priority));
    }
}

public class CreateWorkOrderHandler(
    IApplicationDbContext db, ICurrentTenant tenant, ICodeGeneratorService codes)
    : IRequestHandler<CreateWorkOrderCommand, Guid>
{
    public async Task<Guid> Handle(CreateWorkOrderCommand cmd, CancellationToken ct)
    {
        var code = await codes.NextAsync("WO", tenant.Id, ct);
        var wo = new WorkOrder
        {
            TenantId     = tenant.Id,
            ProjectId    = cmd.ProjectId,
            Code         = code,
            StartDate    = cmd.StartDate,
            DueDate      = cmd.DueDate,
            Priority     = Enum.Parse<Priority>(cmd.Priority),
            AssignedTeam = cmd.AssignedTeam,
            Notes        = cmd.Notes,
        };
        await db.WorkOrders.AddAsync(wo, ct);
        await db.SaveChangesAsync(ct);
        return wo.Id;
    }
}

public record UpdateWorkOrderProgressCommand(Guid Id, int ProgressPct) : IRequest;

public class UpdateWorkOrderProgressHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateWorkOrderProgressCommand>
{
    public async Task Handle(UpdateWorkOrderProgressCommand cmd, CancellationToken ct)
    {
        var wo = await db.WorkOrders.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("أمر التصنيع غير موجود");
        wo.ProgressPct = Math.Clamp(cmd.ProgressPct, 0, 100);
        if (wo.ProgressPct == 100) wo.Status = WorkOrderStatus.Completed;
        else if (wo.ProgressPct > 0)  wo.Status = WorkOrderStatus.InProgress;
        wo.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record CompleteWorkOrderCommand(Guid Id) : IRequest;

public class CompleteWorkOrderHandler(IApplicationDbContext db, IMediator mediator)
    : IRequestHandler<CompleteWorkOrderCommand>
{
    public async Task Handle(CompleteWorkOrderCommand cmd, CancellationToken ct)
    {
        var wo = await db.WorkOrders.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException();
        wo.Status     = WorkOrderStatus.Completed;
        wo.ProgressPct = 100;
        wo.UpdatedAt  = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        await mediator.Publish(new Domain.Events.WorkOrderCompletedEvent(
            wo.TenantId, wo.Id, wo.Code), ct);
    }
}

// ── Cut Plan ──────────────────────────────────────────────────────────────────
public record GetCutPlanQuery(Guid WorkOrderId) : IRequest<List<CutPlanDto>>;

public record CutPlanDto(
    string ProfileCode, string Description, int BarCount,
    decimal UsagePct, decimal RecoverablePct, decimal ScrapPct,
    List<List<int>> Bars);

public class GetCutPlanHandler(IApplicationDbContext db, IBomEngine engine)
    : IRequestHandler<GetCutPlanQuery, List<CutPlanDto>>
{
    public async Task<List<CutPlanDto>> Handle(GetCutPlanQuery q, CancellationToken ct)
    {
        var wo = await db.WorkOrders.Include(w => w.Project)
            .FirstOrDefaultAsync(w => w.Id == q.WorkOrderId && !w.IsDeleted, ct)
            ?? throw new KeyNotFoundException();

        var designs = await db.Designs
            .Include(d => d.Panels).Include(d => d.Finish)
            .Where(d => d.ProjectId == wo.ProjectId && !d.IsDeleted)
            .ToListAsync(ct);

        if (!designs.Any()) return [];

        var seriesId = designs.FirstOrDefault()?.SeriesId ?? Guid.Empty;
        if (seriesId == Guid.Empty) return [];

        var bom = await engine.CalculateAsync(designs, seriesId, ct);
        return bom.OptimizedBars.Select(b => new CutPlanDto(
            b.ProfileCode, b.Description, b.BarCount,
            b.UsagePct, b.RecoverablePct, b.ScrapPct,
            b.Bars.Select(bar => bar.Cuts).ToList())).ToList();
    }
}

// ── QR Codes ─────────────────────────────────────────────────────────────────
public record GetQrCodesQuery(Guid WorkOrderId) : IRequest<List<QrCodeDto>>;
public record QrCodeDto(Guid ItemId, string Description, int Qty, string QrContent, byte[] PngBytes);

public class GetQrCodesHandler(IApplicationDbContext db, IQrCodeService qr)
    : IRequestHandler<GetQrCodesQuery, List<QrCodeDto>>
{
    public async Task<List<QrCodeDto>> Handle(GetQrCodesQuery q, CancellationToken ct)
    {
        var items = await db.WorkOrderItems
            .Where(i => i.WorkOrderId == q.WorkOrderId)
            .ToListAsync(ct);

        return items.Select(i =>
        {
            var content = $"WC:{i.WorkOrderId}:{i.Id}";
            return new QrCodeDto(i.Id, i.Description ?? "", i.Qty, content, qr.GenerateQrCode(content));
        }).ToList();
    }
}

public record ScanQrCommand(string QrContent) : IRequest<WorkOrderItemStatusDto>;
public record WorkOrderItemStatusDto(Guid ItemId, string Description, string Status, string WorkOrderCode);

public class ScanQrHandler(IApplicationDbContext db)
    : IRequestHandler<ScanQrCommand, WorkOrderItemStatusDto>
{
    public async Task<WorkOrderItemStatusDto> Handle(ScanQrCommand cmd, CancellationToken ct)
    {
        // Format: WC:{workOrderId}:{itemId}
        var parts = cmd.QrContent.Split(':');
        if (parts.Length != 3 || parts[0] != "WC")
            throw new ArgumentException("QR غير صالح");

        var itemId = Guid.Parse(parts[2]);
        var item = await db.WorkOrderItems.Include(i => i.WorkOrder)
            .FirstOrDefaultAsync(i => i.Id == itemId, ct)
            ?? throw new KeyNotFoundException("العنصر غير موجود");

        // Advance status
        item.Status = item.Status switch
        {
            "Pending"     => "InProgress",
            "InProgress"  => "Completed",
            _             => item.Status
        };
        await db.SaveChangesAsync(ct);
        return new WorkOrderItemStatusDto(item.Id, item.Description ?? "", item.Status, item.WorkOrder.Code);
    }
}
