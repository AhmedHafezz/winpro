using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Application.Features.Projects;

// ── DTOs ─────────────────────────────────────────────────────────────────────
public record ProjectDto(
    Guid Id, string Code, string? Name, Guid CustomerId, string CustomerName,
    Guid? QuotationId, string Status, decimal TotalValue, decimal PaidAmount,
    decimal RemainingAmount, string? Notes, DateTime CreatedAt);

public record ProjectDetailDto(
    Guid Id, string Code, string? Name, Guid CustomerId, string CustomerName,
    Guid? QuotationId, string Status, decimal TotalValue, decimal PaidAmount,
    decimal RemainingAmount, string? Notes, DateTime CreatedAt,
    List<ProjectDocumentDto> Documents, List<PaymentDto> Payments);

public record ProjectDocumentDto(
    Guid Id, string Type, string? FileName, string? FileUrl, DateTime CreatedAt);

public record PaymentDto(
    Guid Id, decimal Amount, string? Description,
    string Status, string? Notes);

// ── Queries ───────────────────────────────────────────────────────────────────
public record GetProjectsQuery(
    string? Status = null, Guid? CustomerId = null,
    int Page = 1, int PageSize = 20
) : IRequest<PagedResult<ProjectDto>>;

public record GetProjectQuery(Guid Id) : IRequest<ProjectDetailDto>;

public class GetProjectsHandler(IApplicationDbContext db)
    : IRequestHandler<GetProjectsQuery, PagedResult<ProjectDto>>
{
    public async Task<PagedResult<ProjectDto>> Handle(GetProjectsQuery q, CancellationToken ct)
    {
        var query = db.Projects
            .Include(p => p.Customer)
            .Where(p => !p.IsDeleted);

        if (!string.IsNullOrEmpty(q.Status))
            query = query.Where(p => p.Status.ToString() == q.Status);
        if (q.CustomerId.HasValue)
            query = query.Where(p => p.CustomerId == q.CustomerId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(p => new ProjectDto(
                p.Id, p.Code, p.Name, p.CustomerId, p.Customer.Name,
                p.QuotationId, p.Status.ToString(), p.TotalValue,
                p.PaidAmount, p.TotalValue - p.PaidAmount, p.Notes, p.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<ProjectDto>(items, total, q.Page, q.PageSize);
    }
}

public class GetProjectHandler(IApplicationDbContext db)
    : IRequestHandler<GetProjectQuery, ProjectDetailDto>
{
    public async Task<ProjectDetailDto> Handle(GetProjectQuery q, CancellationToken ct)
    {
        var p = await db.Projects
            .Include(x => x.Customer)
            .Include(x => x.Documents)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == q.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("المشروع غير موجود");

        return new ProjectDetailDto(
            p.Id, p.Code, p.Name, p.CustomerId, p.Customer.Name,
            p.QuotationId, p.Status.ToString(), p.TotalValue,
            p.PaidAmount, p.TotalValue - p.PaidAmount, p.Notes, p.CreatedAt,
            p.Documents.Where(d => !d.IsDeleted).Select(d => new ProjectDocumentDto(
                d.Id, d.Type.ToString(), d.FileName, d.FileUrl, d.CreatedAt)).ToList(),
            p.Payments.Where(pay => !pay.IsDeleted).Select(pay => new PaymentDto(
                pay.Id, pay.Amount, pay.Description,
                pay.Status.ToString(), pay.Notes)).ToList());
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────
public record CreateProjectCommand(
    Guid CustomerId, string? Name, Guid? QuotationId,
    decimal TotalValue, string? Notes
) : IRequest<Guid>;

public class CreateProjectValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.TotalValue).GreaterThanOrEqualTo(0);
    }
}

public class CreateProjectHandler(IApplicationDbContext db, ICurrentTenant tenant, ICodeGeneratorService codeGen)
    : IRequestHandler<CreateProjectCommand, Guid>
{
    public async Task<Guid> Handle(CreateProjectCommand cmd, CancellationToken ct)
    {
        var code = await codeGen.GenerateAsync("PRJ", ct);
        var project = new Project
        {
            TenantId   = tenant.Id,
            Code       = code,
            Name       = cmd.Name,
            CustomerId = cmd.CustomerId,
            QuotationId = cmd.QuotationId,
            TotalValue = cmd.TotalValue,
            Notes      = cmd.Notes,
        };
        await db.Projects.AddAsync(project, ct);
        await db.SaveChangesAsync(ct);
        return project.Id;
    }
}

public record UpdateProjectStatusCommand(Guid Id, string Status) : IRequest;

public class UpdateProjectStatusHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateProjectStatusCommand>
{
    public async Task Handle(UpdateProjectStatusCommand cmd, CancellationToken ct)
    {
        var p = await db.Projects.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("المشروع غير موجود");
        p.Status    = Enum.Parse<ProjectStatus>(cmd.Status);
        p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record AddPaymentCommand(
    Guid ProjectId, decimal Amount,
    string? Description, string? Notes
) : IRequest<Guid>;

public class AddPaymentValidator : AbstractValidator<AddPaymentCommand>
{
    public AddPaymentValidator() => RuleFor(x => x.Amount).GreaterThan(0);
}

public class AddPaymentHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<AddPaymentCommand, Guid>
{
    public async Task<Guid> Handle(AddPaymentCommand cmd, CancellationToken ct)
    {
        var project = await db.Projects.FindAsync([cmd.ProjectId], ct)
            ?? throw new KeyNotFoundException("المشروع غير موجود");

        var payment = new Payment
        {
            TenantId    = tenant.Id,
            ProjectId   = cmd.ProjectId,
            Amount      = cmd.Amount,
            Description = cmd.Description,
            Notes       = cmd.Notes,
            Status      = PaymentStatus.Received,
            ReceivedAt  = DateTime.UtcNow,
        };
        await db.Payments.AddAsync(payment, ct);

        project.PaidAmount += cmd.Amount;
        project.UpdatedAt   = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return payment.Id;
    }
}

public record DeleteProjectCommand(Guid Id) : IRequest;

public class DeleteProjectHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteProjectCommand>
{
    public async Task Handle(DeleteProjectCommand cmd, CancellationToken ct)
    {
        var p = await db.Projects.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("المشروع غير موجود");
        p.IsDeleted = true;
        p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
