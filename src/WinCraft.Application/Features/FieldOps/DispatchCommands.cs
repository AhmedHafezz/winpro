using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Application.Features.FieldOps;

// ── DTOs ─────────────────────────────────────────────────────────────────────
public record DispatchDto(
    Guid Id, Guid ProjectId, string ProjectCode, string? CustomerName,
    string Status, DateTime? ScheduledDate, string? DriverName,
    string? VehicleNo, string? Notes, DateTime CreatedAt);

public record InstallationDto(
    Guid Id, Guid ProjectId, string ProjectCode, string? CustomerName,
    string Status, DateTime? ScheduledDate, string? TechnicianName,
    int? Progress, string? Notes, DateTime CreatedAt);

// ── Dispatch Queries ──────────────────────────────────────────────────────────
public record GetDispatchesQuery(
    string? Status = null, int Page = 1, int PageSize = 20
) : IRequest<PagedResult<DispatchDto>>;

public record GetDispatchQuery(Guid Id) : IRequest<DispatchDto>;

public class GetDispatchesHandler(IApplicationDbContext db)
    : IRequestHandler<GetDispatchesQuery, PagedResult<DispatchDto>>
{
    public async Task<PagedResult<DispatchDto>> Handle(GetDispatchesQuery q, CancellationToken ct)
    {
        var query = db.Dispatches
            .Include(d => d.Project).ThenInclude(p => p.Customer)
            .Where(d => !d.IsDeleted);

        if (!string.IsNullOrEmpty(q.Status))
            query = query.Where(d => d.Status.ToString() == q.Status);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(d => new DispatchDto(
                d.Id, d.ProjectId, d.Project.Code, d.Project.Customer.Name,
                d.Status.ToString(), d.ScheduledDate, d.DriverName,
                d.VehicleNo, d.Notes, d.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<DispatchDto>(items, total, q.Page, q.PageSize);
    }
}

public class GetDispatchHandler(IApplicationDbContext db)
    : IRequestHandler<GetDispatchQuery, DispatchDto>
{
    public async Task<DispatchDto> Handle(GetDispatchQuery q, CancellationToken ct)
    {
        var d = await db.Dispatches
            .Include(x => x.Project).ThenInclude(p => p.Customer)
            .FirstOrDefaultAsync(x => x.Id == q.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("الشحنة غير موجودة");

        return new DispatchDto(
            d.Id, d.ProjectId, d.Project.Code, d.Project.Customer.Name,
            d.Status.ToString(), d.ScheduledDate, d.DriverName,
            d.VehicleNo, d.Notes, d.CreatedAt);
    }
}

// ── Dispatch Commands ─────────────────────────────────────────────────────────
public record CreateDispatchCommand(
    Guid ProjectId, DateTime? ScheduledDate,
    string? DriverName, string? VehicleNo, string? Notes
) : IRequest<Guid>;

public class CreateDispatchHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<CreateDispatchCommand, Guid>
{
    public async Task<Guid> Handle(CreateDispatchCommand cmd, CancellationToken ct)
    {
        var dispatch = new Dispatch
        {
            TenantId      = tenant.Id,
            ProjectId     = cmd.ProjectId,
            ScheduledDate = cmd.ScheduledDate,
            DriverName    = cmd.DriverName,
            VehicleNo     = cmd.VehicleNo,
            Notes         = cmd.Notes,
        };
        await db.Dispatches.AddAsync(dispatch, ct);
        await db.SaveChangesAsync(ct);
        return dispatch.Id;
    }
}

public record DeliverDispatchCommand(Guid Id) : IRequest;

public class DeliverDispatchHandler(IApplicationDbContext db)
    : IRequestHandler<DeliverDispatchCommand>
{
    public async Task Handle(DeliverDispatchCommand cmd, CancellationToken ct)
    {
        var d = await db.Dispatches.FindAsync([cmd.Id], ct)
            ?? throw new KeyNotFoundException("الشحنة غير موجودة");
        d.Status    = DispatchStatus.Delivered;
        d.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record ConfirmDispatchCommand(Guid Id) : IRequest;

public class ConfirmDispatchHandler(IApplicationDbContext db)
    : IRequestHandler<ConfirmDispatchCommand>
{
    public async Task Handle(ConfirmDispatchCommand cmd, CancellationToken ct)
    {
        var d = await db.Dispatches.FindAsync([cmd.Id], ct)
            ?? throw new KeyNotFoundException("الشحنة غير موجودة");
        d.Status    = DispatchStatus.Confirmed;
        d.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

// ── Installation Queries ──────────────────────────────────────────────────────
public record GetInstallationsQuery(
    string? Status = null, int Page = 1, int PageSize = 20
) : IRequest<PagedResult<InstallationDto>>;

public record GetInstallationQuery(Guid Id) : IRequest<InstallationDto>;

public class GetInstallationsHandler(IApplicationDbContext db)
    : IRequestHandler<GetInstallationsQuery, PagedResult<InstallationDto>>
{
    public async Task<PagedResult<InstallationDto>> Handle(GetInstallationsQuery q, CancellationToken ct)
    {
        var query = db.InstallationJobs
            .Include(i => i.Project).ThenInclude(p => p.Customer)
            .Where(i => !i.IsDeleted);

        if (!string.IsNullOrEmpty(q.Status))
            query = query.Where(i => i.Status.ToString() == q.Status);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(i => new InstallationDto(
                i.Id, i.ProjectId, i.Project.Code, i.Project.Customer.Name,
                i.Status.ToString(), i.ScheduledDate, i.TechnicianName,
                i.Progress, i.Notes, i.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<InstallationDto>(items, total, q.Page, q.PageSize);
    }
}

public class GetInstallationHandler(IApplicationDbContext db)
    : IRequestHandler<GetInstallationQuery, InstallationDto>
{
    public async Task<InstallationDto> Handle(GetInstallationQuery q, CancellationToken ct)
    {
        var i = await db.InstallationJobs
            .Include(x => x.Project).ThenInclude(p => p.Customer)
            .FirstOrDefaultAsync(x => x.Id == q.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("مهمة التركيب غير موجودة");

        return new InstallationDto(
            i.Id, i.ProjectId, i.Project.Code, i.Project.Customer.Name,
            i.Status.ToString(), i.ScheduledDate, i.TechnicianName,
            i.Progress, i.Notes, i.CreatedAt);
    }
}

// ── Installation Commands ─────────────────────────────────────────────────────
public record CreateInstallationCommand(
    Guid ProjectId, DateTime? ScheduledDate,
    string? TechnicianName, string? Notes
) : IRequest<Guid>;

public class CreateInstallationHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<CreateInstallationCommand, Guid>
{
    public async Task<Guid> Handle(CreateInstallationCommand cmd, CancellationToken ct)
    {
        var job = new InstallationJob
        {
            TenantId       = tenant.Id,
            ProjectId      = cmd.ProjectId,
            ScheduledDate  = cmd.ScheduledDate,
            TechnicianName = cmd.TechnicianName,
            Notes          = cmd.Notes,
        };
        await db.InstallationJobs.AddAsync(job, ct);
        await db.SaveChangesAsync(ct);
        return job.Id;
    }
}

public record UpdateInstallationProgressCommand(Guid Id, int Progress) : IRequest;

public class UpdateInstallationProgressHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateInstallationProgressCommand>
{
    public async Task Handle(UpdateInstallationProgressCommand cmd, CancellationToken ct)
    {
        var i = await db.InstallationJobs.FindAsync([cmd.Id], ct)
            ?? throw new KeyNotFoundException("مهمة التركيب غير موجودة");
        i.Progress  = Math.Clamp(cmd.Progress, 0, 100);
        i.Status    = i.Progress == 100 ? InstallStatus.Completed : InstallStatus.InProgress;
        i.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record CompleteInstallationCommand(Guid Id) : IRequest;

public class CompleteInstallationHandler(IApplicationDbContext db)
    : IRequestHandler<CompleteInstallationCommand>
{
    public async Task Handle(CompleteInstallationCommand cmd, CancellationToken ct)
    {
        var i = await db.InstallationJobs.FindAsync([cmd.Id], ct)
            ?? throw new KeyNotFoundException("مهمة التركيب غير موجودة");
        i.Status    = InstallStatus.Completed;
        i.Progress  = 100;
        i.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
