using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Application.Features.Customers;

// ── DTOs ──────────────────────────────────────────────────────────────────────
public record CustomerDto(
    Guid Id, string Name, string Type, string? Phone, string? Email,
    string? City, string? Address, string Status, string? Notes,
    DateTime CreatedAt);

// ── Queries ──────────────────────────────────────────────────────────────────
public record GetCustomersQuery(
    string? Search = null, string? Status = null,
    int Page = 1, int PageSize = 20
) : IRequest<PagedResult<CustomerDto>>;

public record GetCustomerQuery(Guid Id) : IRequest<CustomerDto>;

public class GetCustomersHandler(IApplicationDbContext db)
    : IRequestHandler<GetCustomersQuery, PagedResult<CustomerDto>>
{
    public async Task<PagedResult<CustomerDto>> Handle(GetCustomersQuery q, CancellationToken ct)
    {
        var query = db.Customers.Where(c => !c.IsDeleted);
        if (!string.IsNullOrEmpty(q.Search))
            query = query.Where(c =>
                c.Name.Contains(q.Search) ||
                (c.Phone != null && c.Phone.Contains(q.Search)) ||
                (c.Email != null && c.Email.Contains(q.Search)));
        if (!string.IsNullOrEmpty(q.Status))
            query = query.Where(c => c.Status.ToString() == q.Status);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(c => new CustomerDto(c.Id, c.Name, c.Type.ToString(),
                c.Phone, c.Email, c.City, c.Address, c.Status.ToString(), c.Notes, c.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<CustomerDto>(items, total, q.Page, q.PageSize);
    }
}

public class GetCustomerHandler(IApplicationDbContext db)
    : IRequestHandler<GetCustomerQuery, CustomerDto>
{
    public async Task<CustomerDto> Handle(GetCustomerQuery q, CancellationToken ct)
    {
        var c = await db.Customers.FirstOrDefaultAsync(x => x.Id == q.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("العميل غير موجود");
        return new CustomerDto(c.Id, c.Name, c.Type.ToString(),
            c.Phone, c.Email, c.City, c.Address, c.Status.ToString(), c.Notes, c.CreatedAt);
    }
}

// ── Commands ─────────────────────────────────────────────────────────────────
public record CreateCustomerCommand(
    string Name, string Type, string? Phone, string? Email,
    string? City, string? Address, string? Notes
) : IRequest<Guid>;

public class CreateCustomerValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Type).IsEnumName(typeof(CustomerType));
    }
}

public class CreateCustomerHandler(IApplicationDbContext db, ICurrentTenant tenant)
    : IRequestHandler<CreateCustomerCommand, Guid>
{
    public async Task<Guid> Handle(CreateCustomerCommand cmd, CancellationToken ct)
    {
        var customer = new Customer
        {
            TenantId = tenant.Id,
            Name     = cmd.Name,
            Type     = Enum.Parse<CustomerType>(cmd.Type),
            Phone    = cmd.Phone,
            Email    = cmd.Email,
            City     = cmd.City,
            Address  = cmd.Address,
            Notes    = cmd.Notes,
        };
        await db.Customers.AddAsync(customer, ct);
        await db.SaveChangesAsync(ct);
        return customer.Id;
    }
}

public record UpdateCustomerCommand(
    Guid Id, string Name, string Type, string? Phone, string? Email,
    string? City, string? Address, string Status, string? Notes
) : IRequest;

public class UpdateCustomerHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateCustomerCommand>
{
    public async Task Handle(UpdateCustomerCommand cmd, CancellationToken ct)
    {
        var c = await db.Customers.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("العميل غير موجود");
        c.Name    = cmd.Name;
        c.Type    = Enum.Parse<CustomerType>(cmd.Type);
        c.Phone   = cmd.Phone;
        c.Email   = cmd.Email;
        c.City    = cmd.City;
        c.Address = cmd.Address;
        c.Status  = Enum.Parse<CustomerStatus>(cmd.Status);
        c.Notes   = cmd.Notes;
        c.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteCustomerCommand(Guid Id) : IRequest;

public class DeleteCustomerHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteCustomerCommand>
{
    public async Task Handle(DeleteCustomerCommand cmd, CancellationToken ct)
    {
        var c = await db.Customers.FirstOrDefaultAsync(x => x.Id == cmd.Id && !x.IsDeleted, ct)
            ?? throw new KeyNotFoundException("العميل غير موجود");
        c.IsDeleted = true;
        c.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}

