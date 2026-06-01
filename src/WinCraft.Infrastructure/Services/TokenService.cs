using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;

namespace WinCraft.Infrastructure.Services;

public class TokenService(IConfiguration config) : ITokenService
{
    public string GenerateAccessToken(User user, string[] permissions)
    {
        var claims = new[]
        {
            new Claim("sub",         user.Id.ToString()),
            new Claim("tenant_id",   user.TenantId.ToString()),
            new Claim("email",       user.Email),
            new Claim("name",        user.FullName),
            new Claim("role",        user.Role?.Name ?? ""),
            new Claim("permissions", JsonSerializer.Serialize(permissions)),
        };

        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = int.TryParse(config["Jwt:AccessExpiryMinutes"], out var m) ? m : 15;

        var token = new JwtSecurityToken(
            claims:  claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
