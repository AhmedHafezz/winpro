using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Application.Features.Customers;

public record DealDto(
    Guid Id, Guid CustomerId, string CustomerName, string? AssignedUserName,
    string Title, decimal Value, string Stage, int ProbabilityPct,
    DateOnly? DueDate, string? Notes, DateTime CreatedAt);

public record GetDealsQuery(string? Stage = null, Guid? CustomerId = null) : IRequest<List<DealDto>>;

public class GetDealsHandler(IApplicationDbContext db)
    : IRequestHandler<GetDealsQuery, List<DealDto>>
{
    public async Task<List<DealDto>> Handle(GetDealsQuery q, CancellationToken ct)
    {
        var query = db.Deals
            .Include(d => d.Customer)
            .Include(d => d.AssignedUser)
            .Where(d => !d.IsDeleted);

        if (!string.IsNullOrEmpty(q.Stage))
            query = query.Where(d => d.Stage.ToString() == q.Stage);
        if (q.CustomerId.HasValue)
            query = query.Where(d => d.CustomerId == q.CustomerId);

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DealDto(
                d.Id, d.CustomerId, d.Customer.Name,
                d.AssignedUser != null ? d.AssignedUser.FullName : null,
                d.Title, d.Value, d.Stage.ToString(), d.ProbabilityPct,
                d.DueDate, d.Notes, d.CreatedAt))
            .ToListAsync(ct);
    }
}

public record CreateDealCommand(
    Guid CustomerId, string Title, decimal Value,
    int ProbabilityPct, DateOnly? DueDate, string? Notes,
    Guid? AssignedUserId
) : IRequest<Guid>;

public class CreateDealValidator : AbstractValidator<CreateDealCommand>
{
    public CreateDealValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Value).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ProbabilityPct).InclusiveBetween(0, 100);
    }
}

public class CreateDealHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<CreateDealCommand, Guid>
{
    public async Task<Guid> Handle(CreateDealCommand cmd, CancellationToken ct)
    {
        var deal = new Deal
        {
            TenantId       = tenant.Id,
            CustomerId     = cmd.CustomerId,
            Title          = cmd.Title,
            Value          = cmd.Value,
            ProbabilityPct = cmd.ProbabilityPct,
            DueDate        = cmd.DueDate,
            Notes          = cmd.Notes,
            AssignedUserId = cmd.AssignedUserId,
        };
        await db.Deals.AddAsync(deal, ct);
        await db.SaveChangesAsync(ct);
        return deal.Id;
    }
}

public record UpdateDealStageCommand(Guid Id, string Stage) : IRequest;

public class UpdateDealStageHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateDealStageCommand>
{
    public async Task Handle(UpdateDealStageCommand cmd, CancellationToken ct)
    {
        var d = await db.Deals.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("الصفقة غير موجودة");
        d.Stage = Enum.Parse<DealStage>(cmd.Stage);
        d.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteDealCommand(Guid Id) : IRequest;

public class DeleteDealHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteDealCommand>
{
    public async Task Handle(DeleteDealCommand cmd, CancellationToken ct)
    {
        var d = await db.Deals.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("الصفقة غير موجودة");
        d.IsDeleted = true;
        await db.SaveChangesAsync(ct);
    }
}
