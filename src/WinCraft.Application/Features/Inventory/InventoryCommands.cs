using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Application.Features.Inventory;

// ── DTOs ─────────────────────────────────────────────────────────────────────
public record InventoryItemDto(
    Guid Id, string Code, string? Name, string? NameAr,
    string? Category, string? Unit, decimal Price,
    decimal MinStock, decimal CurrentStock, string? Location,
    bool IsLowStock, bool IsActive);

public record StockMovementDto(
    Guid Id, Guid ItemId, string ItemCode, string Type,
    decimal Qty, DateTime Date, string? Reference, string? Note);

public record OffCutDto(
    Guid Id, Guid ItemId, string ItemCode, string? Code,
    int LengthMm, int Qty, string? JobRef, bool Usable, DateTime Date);

// ── Queries ───────────────────────────────────────────────────────────────────
public record GetInventoryQuery(
    string? Category = null, bool? LowStock = null,
    int Page = 1, int PageSize = 20
) : IRequest<PagedResult<InventoryItemDto>>;

public record GetLowStockQuery : IRequest<List<InventoryItemDto>>;

public record GetOffCutsQuery(bool? Usable = null) : IRequest<List<OffCutDto>>;

public class GetInventoryHandler(IApplicationDbContext db)
    : IRequestHandler<GetInventoryQuery, PagedResult<InventoryItemDto>>
{
    public async Task<PagedResult<InventoryItemDto>> Handle(GetInventoryQuery q, CancellationToken ct)
    {
        var query = db.InventoryItems.Where(i => !i.IsDeleted);
        if (!string.IsNullOrEmpty(q.Category)) query = query.Where(i => i.Category == q.Category);
        if (q.LowStock == true) query = query.Where(i => i.CurrentStock <= i.MinStock && i.MinStock > 0);

        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(i => i.Code)
            .Skip((q.Page - 1) * q.PageSize).Take(q.PageSize)
            .Select(i => ToDto(i)).ToListAsync(ct);
        return new PagedResult<InventoryItemDto>(items, total, q.Page, q.PageSize);
    }

    private static InventoryItemDto ToDto(InventoryItem i) => new(
        i.Id, i.Code, i.Name, i.NameAr, i.Category, i.Unit,
        i.Price, i.MinStock, i.CurrentStock, i.Location,
        i.CurrentStock <= i.MinStock && i.MinStock > 0, i.IsActive);
}

public class GetLowStockHandler(IApplicationDbContext db)
    : IRequestHandler<GetLowStockQuery, List<InventoryItemDto>>
{
    public async Task<List<InventoryItemDto>> Handle(GetLowStockQuery q, CancellationToken ct)
        => await db.InventoryItems
            .Where(i => !i.IsDeleted && i.IsActive && i.CurrentStock <= i.MinStock && i.MinStock > 0)
            .Select(i => new InventoryItemDto(i.Id, i.Code, i.Name, i.NameAr, i.Category,
                i.Unit, i.Price, i.MinStock, i.CurrentStock, i.Location, true, i.IsActive))
            .ToListAsync(ct);
}

public class GetOffCutsHandler(IApplicationDbContext db)
    : IRequestHandler<GetOffCutsQuery, List<OffCutDto>>
{
    public async Task<List<OffCutDto>> Handle(GetOffCutsQuery q, CancellationToken ct)
    {
        var query = db.OffCuts.Include(o => o.Item).Where(o => !o.IsDeleted);
        if (q.Usable.HasValue) query = query.Where(o => o.Usable == q.Usable);
        return await query.OrderByDescending(o => o.Date)
            .Select(o => new OffCutDto(o.Id, o.ItemId, o.Item.Code, o.Code,
                o.LengthMm, o.Qty, o.JobRef, o.Usable, o.Date))
            .ToListAsync(ct);
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────
public record CreateInventoryItemCommand(
    string Code, string? Name, string? NameAr, string? Category,
    string? Unit, decimal Price, decimal MinStock, string? Location
) : IRequest<Guid>;

public class CreateInventoryItemValidator : AbstractValidator<CreateInventoryItemCommand>
{
    public CreateInventoryItemValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
    }
}

public class CreateInventoryItemHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<CreateInventoryItemCommand, Guid>
{
    public async Task<Guid> Handle(CreateInventoryItemCommand cmd, CancellationToken ct)
    {
        var item = new InventoryItem
        {
            TenantId = tenant.Id, Code = cmd.Code, Name = cmd.Name,
            NameAr = cmd.NameAr, Category = cmd.Category, Unit = cmd.Unit,
            Price = cmd.Price, MinStock = cmd.MinStock, Location = cmd.Location,
        };
        await db.InventoryItems.AddAsync(item, ct);
        await db.SaveChangesAsync(ct);
        return item.Id;
    }
}

public record AddStockMovementCommand(
    Guid ItemId, string Type, decimal Qty,
    string? Reference, string? Note
) : IRequest;

public class AddStockMovementHandler(IApplicationDbContext db, ICurrentTenant tenant, ICurrentUser user)
    : IRequestHandler<AddStockMovementCommand>
{
    public async Task Handle(AddStockMovementCommand cmd, CancellationToken ct)
    {
        var item = await db.InventoryItems.FindAsync([cmd.ItemId], ct)
            ?? throw new KeyNotFoundException("الصنف غير موجود");

        var type = Enum.Parse<MovementType>(cmd.Type);
        var movement = new StockMovement
        {
            TenantId  = tenant.Id, ItemId = cmd.ItemId, Type = type,
            Qty = cmd.Qty, Reference = cmd.Reference, Note = cmd.Note,
            UserId = user.IsAuthenticated ? user.Id : null,
        };
        await db.StockMovements.AddAsync(movement, ct);

        // Update current stock
        item.CurrentStock += type switch
        {
            MovementType.In     =>  cmd.Qty,
            MovementType.Out    => -cmd.Qty,
            MovementType.Return =>  cmd.Qty,
            MovementType.Adjust =>  cmd.Qty,
            _                   => 0,
        };
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record UseOffCutCommand(Guid OffCutId, string? JobRef) : IRequest;

public class UseOffCutHandler(IApplicationDbContext db)
    : IRequestHandler<UseOffCutCommand>
{
    public async Task Handle(UseOffCutCommand cmd, CancellationToken ct)
    {
        var oc = await db.OffCuts.FindAsync([cmd.OffCutId], ct)
            ?? throw new KeyNotFoundException("القطعة غير موجودة");
        oc.Usable = false;
        oc.JobRef = cmd.JobRef ?? oc.JobRef;
        await db.SaveChangesAsync(ct);
    }
}
