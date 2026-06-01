using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Application.Features.Surveys;

// ── DTOs ─────────────────────────────────────────────────────────────────────
public record SurveyDto(
    Guid Id, string Code, Guid CustomerId, string CustomerName,
    string Status, DateTime? ScheduledDate, string? TechnicianName,
    string? Notes, DateTime CreatedAt);

public record SurveyDetailDto(
    Guid Id, string Code, Guid CustomerId, string CustomerName,
    string Status, DateTime? ScheduledDate, string? TechnicianName,
    string? Notes, DateTime CreatedAt, List<SurveyItemDto> Items);

public record SurveyItemDto(
    Guid Id, string? Description, double WidthMm, double HeightMm,
    int Qty, string? Location, string? Notes);

// ── Queries ───────────────────────────────────────────────────────────────────
public record GetSurveysQuery(
    string? Status = null, Guid? CustomerId = null,
    int Page = 1, int PageSize = 20
) : IRequest<PagedResult<SurveyDto>>;

public record GetSurveyQuery(Guid Id) : IRequest<SurveyDetailDto>;

public class GetSurveysHandler(IApplicationDbContext db)
    : IRequestHandler<GetSurveysQuery, PagedResult<SurveyDto>>
{
    public async Task<PagedResult<SurveyDto>> Handle(GetSurveysQuery q, CancellationToken ct)
    {
        var query = db.Surveys
            .Include(s => s.Customer)
            .Where(s => !s.IsDeleted);

        if (!string.IsNullOrEmpty(q.Status))
            query = query.Where(s => s.Status.ToString() == q.Status);
        if (q.CustomerId.HasValue)
            query = query.Where(s => s.CustomerId == q.CustomerId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(s => new SurveyDto(
                s.Id, s.Code, s.CustomerId, s.Customer.Name,
                s.Status.ToString(), s.ScheduledDate, s.TechnicianName,
                s.Notes, s.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<SurveyDto>(items, total, q.Page, q.PageSize);
    }
}

public class GetSurveyHandler(IApplicationDbContext db)
    : IRequestHandler<GetSurveyQuery, SurveyDetailDto>
{
    public async Task<SurveyDetailDto> Handle(GetSurveyQuery q, CancellationToken ct)
    {
        var s = await db.Surveys
            .Include(x => x.Customer)
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == q.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("المعاينة غير موجودة");

        return new SurveyDetailDto(
            s.Id, s.Code, s.CustomerId, s.Customer.Name,
            s.Status.ToString(), s.ScheduledDate, s.TechnicianName,
            s.Notes, s.CreatedAt,
            s.Items.Select(i => new SurveyItemDto(
                i.Id, i.Description, i.WidthMm, i.HeightMm,
                i.Qty, i.Location, i.Notes)).ToList());
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────
public record CreateSurveyCommand(
    Guid CustomerId, DateTime? ScheduledDate,
    string? TechnicianName, string? Notes
) : IRequest<Guid>;

public class CreateSurveyValidator : AbstractValidator<CreateSurveyCommand>
{
    public CreateSurveyValidator() => RuleFor(x => x.CustomerId).NotEmpty();
}

public class CreateSurveyHandler(IApplicationDbContext db, ICurrentTenant tenant, ICodeGeneratorService codeGen)
    : IRequestHandler<CreateSurveyCommand, Guid>
{
    public async Task<Guid> Handle(CreateSurveyCommand cmd, CancellationToken ct)
    {
        var code = await codeGen.GenerateAsync("SRV", ct);
        var survey = new Survey
        {
            TenantId       = tenant.Id,
            Code           = code,
            CustomerId     = cmd.CustomerId,
            ScheduledDate  = cmd.ScheduledDate,
            TechnicianName = cmd.TechnicianName,
            Notes          = cmd.Notes,
        };
        await db.Surveys.AddAsync(survey, ct);
        await db.SaveChangesAsync(ct);
        return survey.Id;
    }
}

public record AddSurveyItemCommand(
    Guid SurveyId, string? Description, double WidthMm, double HeightMm,
    int Qty, string? Location, string? Notes
) : IRequest<Guid>;

public class AddSurveyItemHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<AddSurveyItemCommand, Guid>
{
    public async Task<Guid> Handle(AddSurveyItemCommand cmd, CancellationToken ct)
    {
        var survey = await db.Surveys.FindAsync([cmd.SurveyId], ct)
            ?? throw new KeyNotFoundException("المعاينة غير موجودة");

        var item = new SurveyItem
        {
            TenantId    = tenant.Id,
            SurveyId    = cmd.SurveyId,
            Description = cmd.Description,
            WidthMm     = cmd.WidthMm,
            HeightMm    = cmd.HeightMm,
            Qty         = cmd.Qty,
            Location    = cmd.Location,
            Notes       = cmd.Notes,
        };
        await db.SurveyItems.AddAsync(item, ct);
        survey.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return item.Id;
    }
}

public record SubmitSurveyCommand(Guid Id) : IRequest;

public class SubmitSurveyHandler(IApplicationDbContext db)
    : IRequestHandler<SubmitSurveyCommand>
{
    public async Task Handle(SubmitSurveyCommand cmd, CancellationToken ct)
    {
        var s = await db.Surveys.FindAsync([cmd.Id], ct)
            ?? throw new KeyNotFoundException("المعاينة غير موجودة");
        s.Status    = SurveyStatus.Completed;
        s.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record ConvertSurveyToQuotationCommand(Guid SurveyId) : IRequest<Guid>;

public class ConvertSurveyToQuotationHandler(IApplicationDbContext db, ICurrentTenant tenant, ICodeGeneratorService codeGen)
    : IRequestHandler<ConvertSurveyToQuotationCommand, Guid>
{
    public async Task<Guid> Handle(ConvertSurveyToQuotationCommand cmd, CancellationToken ct)
    {
        var s = await db.Surveys
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == cmd.SurveyId && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("المعاينة غير موجودة");

        var code = await codeGen.GenerateAsync("QT", ct);
        var quotation = new Quotation
        {
            TenantId   = tenant.Id,
            Code       = code,
            CustomerId = s.CustomerId,
            Notes      = $"تم إنشاؤه من معاينة: {s.Code}",
        };
        await db.Quotations.AddAsync(quotation, ct);

        s.Status    = SurveyStatus.Converted;
        s.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return quotation.Id;
    }
}
