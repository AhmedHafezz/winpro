using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;
using WinCraft.Domain.Events;
using WinCraft.Shared.Helpers;

namespace WinCraft.Application.Features.Quotations;

public record QuotationDto(
    Guid Id, string Code, Guid CustomerId, string CustomerName,
    string Status, DateOnly? Date, DateOnly? ValidUntil,
    decimal DiscountPct, decimal TaxPct, decimal TotalValue,
    int RevisionNumber, string? Notes, int OpensCount, DateTime CreatedAt);

public record GetQuotationsQuery(
    string? Status = null, Guid? CustomerId = null,
    int Page = 1, int PageSize = 20
) : IRequest<PagedResult<QuotationDto>>;

public record GetQuotationQuery(Guid Id) : IRequest<QuotationDto>;

public class GetQuotationsHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuotationsQuery, PagedResult<QuotationDto>>
{
    public async Task<PagedResult<QuotationDto>> Handle(GetQuotationsQuery q, CancellationToken ct)
    {
        var query = db.Quotations.Include(x => x.Customer).Where(x => !x.IsDeleted);
        if (!string.IsNullOrEmpty(q.Status)) query = query.Where(x => x.Status.ToString() == q.Status);
        if (q.CustomerId.HasValue) query = query.Where(x => x.CustomerId == q.CustomerId);

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize).Take(q.PageSize)
            .Select(x => MapDto(x)).ToListAsync(ct);
        return new PagedResult<QuotationDto>(items, total, q.Page, q.PageSize);
    }

    private static QuotationDto MapDto(Quotation x) => new(
        x.Id, x.Code, x.CustomerId, x.Customer.Name,
        x.Status.ToString(), x.Date, x.ValidUntil,
        x.DiscountPct, x.TaxPct, x.TotalValue,
        x.RevisionNumber, x.Notes, x.OpensCount, x.CreatedAt);
}

public class GetQuotationHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuotationQuery, QuotationDto>
{
    public async Task<QuotationDto> Handle(GetQuotationQuery q, CancellationToken ct)
    {
        var x = await db.Quotations.Include(x => x.Customer)
            .FirstOrDefaultAsync(x => x.Id == q.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("عرض السعر غير موجود");
        return new QuotationDto(x.Id, x.Code, x.CustomerId, x.Customer.Name,
            x.Status.ToString(), x.Date, x.ValidUntil,
            x.DiscountPct, x.TaxPct, x.TotalValue,
            x.RevisionNumber, x.Notes, x.OpensCount, x.CreatedAt);
    }
}

public record CreateQuotationCommand(
    Guid CustomerId, DateOnly? Date, DateOnly? ValidUntil,
    decimal DiscountPct, decimal TaxPct, string? Notes,
    Guid? AssignedUserId
) : IRequest<Guid>;

public class CreateQuotationValidator : AbstractValidator<CreateQuotationCommand>
{
    public CreateQuotationValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.DiscountPct).InclusiveBetween(0, 100);
        RuleFor(x => x.TaxPct).InclusiveBetween(0, 100);
    }
}

public class CreateQuotationHandler(
    IApplicationDbContext db, ICurrentTenant tenant, ICodeGeneratorService codes)
    : IRequestHandler<CreateQuotationCommand, Guid>
{
    public async Task<Guid> Handle(CreateQuotationCommand cmd, CancellationToken ct)
    {
        var code = await codes.NextAsync("QT", tenant.Id, ct);
        var q = new Quotation
        {
            TenantId       = tenant.Id,
            CustomerId     = cmd.CustomerId,
            Code           = code,
            Date           = cmd.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
            ValidUntil     = cmd.ValidUntil,
            DiscountPct    = cmd.DiscountPct,
            TaxPct         = cmd.TaxPct,
            Notes          = cmd.Notes,
            AssignedUserId = cmd.AssignedUserId,
            SmartLinkToken = Guid.NewGuid().ToString("N"),
        };
        await db.Quotations.AddAsync(q, ct);
        await db.SaveChangesAsync(ct);
        return q.Id;
    }
}

public record SendQuotationCommand(Guid Id) : IRequest;
public class SendQuotationHandler(IApplicationDbContext db)
    : IRequestHandler<SendQuotationCommand>
{
    public async Task Handle(SendQuotationCommand cmd, CancellationToken ct)
    {
        var q = await db.Quotations.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException();
        if (q.Status != QuotationStatus.Draft)
            throw new InvalidOperationException("يمكن إرسال عروض الأسعار المسودة فقط");
        q.Status = QuotationStatus.Sent;
        q.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record ApproveQuotationCommand(Guid Id, DateOnly? ExpectedDelivery) : IRequest;

public class ApproveQuotationHandler(IApplicationDbContext db, IMediator mediator)
    : IRequestHandler<ApproveQuotationCommand>
{
    public async Task Handle(ApproveQuotationCommand cmd, CancellationToken ct)
    {
        var q = await db.Quotations
            .Include(x => x.Customer)
            .Include(x => x.Designs).ThenInclude(d => d.Panels)
            .FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException();

        q.Status = QuotationStatus.Accepted;
        q.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var firstDesign = q.Designs.FirstOrDefault();
        var seriesId = firstDesign?.SeriesId ?? Guid.Empty;

        await mediator.Publish(new QuotationApprovedEvent(
            q.TenantId, q.Id, q.CustomerId,
            q.Customer.Name, cmd.ExpectedDelivery,
            q.Designs.ToList(), seriesId, q.AssignedUserId), ct);
    }
}

public record RejectQuotationCommand(Guid Id, string? Reason) : IRequest;
public class RejectQuotationHandler(IApplicationDbContext db)
    : IRequestHandler<RejectQuotationCommand>
{
    public async Task Handle(RejectQuotationCommand cmd, CancellationToken ct)
    {
        var q = await db.Quotations.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException();
        q.Status = QuotationStatus.Rejected;
        q.Notes = string.IsNullOrEmpty(cmd.Reason) ? q.Notes : $"{q.Notes}\nالسبب: {cmd.Reason}";
        q.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record OpenSmartLinkCommand(string Token) : IRequest<QuotationDto>;
public class OpenSmartLinkHandler(IApplicationDbContext db)
    : IRequestHandler<OpenSmartLinkCommand, QuotationDto>
{
    public async Task<QuotationDto> Handle(OpenSmartLinkCommand cmd, CancellationToken ct)
    {
        var q = await db.Quotations
            .Include(x => x.Customer)
            .FirstOrDefaultAsync(x => x.SmartLinkToken == cmd.Token && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("الرابط غير صالح");
        q.OpensCount++;
        if (q.Status == QuotationStatus.Sent) q.Status = QuotationStatus.Opened;
        q.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return new QuotationDto(q.Id, q.Code, q.CustomerId, q.Customer.Name,
            q.Status.ToString(), q.Date, q.ValidUntil,
            q.DiscountPct, q.TaxPct, q.TotalValue,
            q.RevisionNumber, q.Notes, q.OpensCount, q.CreatedAt);
    }
}

public record DuplicateQuotationCommand(Guid Id) : IRequest<Guid>;
public class DuplicateQuotationHandler(IApplicationDbContext db, ICodeGeneratorService codes)
    : IRequestHandler<DuplicateQuotationCommand, Guid>
{
    public async Task<Guid> Handle(DuplicateQuotationCommand cmd, CancellationToken ct)
    {
        var original = await db.Quotations
            .Include(x => x.Designs).ThenInclude(d => d.Panels)
            .FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException();

        var code = await codes.NextAsync("QT", original.TenantId, ct);
        var copy = new Quotation
        {
            TenantId       = original.TenantId,
            CustomerId     = original.CustomerId,
            Code           = code,
            Date           = DateOnly.FromDateTime(DateTime.UtcNow),
            ValidUntil     = original.ValidUntil,
            DiscountPct    = original.DiscountPct,
            TaxPct         = original.TaxPct,
            Notes          = original.Notes,
            AssignedUserId = original.AssignedUserId,
            RevisionNumber = original.RevisionNumber + 1,
            SmartLinkToken = Guid.NewGuid().ToString("N"),
        };
        await db.Quotations.AddAsync(copy, ct);
        await db.SaveChangesAsync(ct);
        return copy.Id;
    }
}

