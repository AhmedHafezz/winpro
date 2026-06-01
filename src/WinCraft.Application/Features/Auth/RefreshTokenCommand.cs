using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;

namespace WinCraft.Application.Features.Auth;

public record RefreshTokenCommand(string RefreshToken) : IRequest<LoginResult>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class RefreshTokenHandler(
    IApplicationDbContext db,
    ITokenService tokenService)
    : IRequestHandler<RefreshTokenCommand, LoginResult>
{
    public async Task<LoginResult> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.Role)
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u =>
                u.RefreshToken == cmd.RefreshToken &&
                u.RefreshTokenExpiry > DateTime.UtcNow &&
                !u.IsDeleted, ct)
            ?? throw new UnauthorizedAccessException("Refresh token غير صالح");

        var permissions = user.Role?.Permissions ?? [];
        var accessToken  = tokenService.GenerateAccessToken(user, permissions);
        var newRefresh   = tokenService.GenerateRefreshToken();

        user.RefreshToken = newRefresh;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await db.SaveChangesAsync(ct);

        return new LoginResult(accessToken, newRefresh,
            user.Id, user.FullName, user.Email,
            user.Role?.Name ?? "", permissions, user.TenantId);
    }
}
