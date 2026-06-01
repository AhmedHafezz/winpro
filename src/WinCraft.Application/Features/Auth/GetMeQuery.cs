using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;

namespace WinCraft.Application.Features.Auth;

public record GetMeQuery : IRequest<MeResult>;

public record MeResult(
    Guid Id, string FullName, string Email, string? Phone,
    string Role, string[] Permissions, Guid TenantId,
    string TenantName, string? TenantLogo);

public class GetMeHandler(IApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetMeQuery, MeResult>
{
    public async Task<MeResult> Handle(GetMeQuery _, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.Role)
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == currentUser.Id && !u.IsDeleted, ct)
            ?? throw new UnauthorizedAccessException();

        return new MeResult(user.Id, user.FullName, user.Email, user.Phone,
            user.Role?.Name ?? "", user.Role?.Permissions ?? [],
            user.TenantId, user.Tenant.Name, user.Tenant.LogoUrl);
    }
}
