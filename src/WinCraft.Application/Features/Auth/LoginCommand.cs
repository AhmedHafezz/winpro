using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;

namespace WinCraft.Application.Features.Auth;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}

public record LoginResult(
    string AccessToken,
    string RefreshToken,
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    string[] Permissions,
    Guid TenantId
);

public class LoginHandler(
    IApplicationDbContext db,
    ITokenService tokenService)
    : IRequestHandler<LoginCommand, LoginResult>
{
    public async Task<LoginResult> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.Role)
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == cmd.Email && !u.IsDeleted, ct)
            ?? throw new UnauthorizedAccessException("بيانات الدخول غير صحيحة");

        if (!BCrypt.Net.BCrypt.Verify(cmd.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("بيانات الدخول غير صحيحة");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("الحساب غير مفعّل");

        if (!user.Tenant.IsActive)
            throw new UnauthorizedAccessException("الاشتراك غير مفعّل");

        var permissions = user.Role?.Permissions ?? [];
        var accessToken  = tokenService.GenerateAccessToken(user, permissions);
        var refreshToken = tokenService.GenerateRefreshToken();

        user.LastLoginAt = DateTime.UtcNow;
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await db.SaveChangesAsync(ct);

        return new LoginResult(accessToken, refreshToken,
            user.Id, user.FullName, user.Email,
            user.Role?.Name ?? "", permissions, user.TenantId);
    }
}
