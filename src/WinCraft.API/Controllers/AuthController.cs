using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.Auth;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    /// <summary>Login and get JWT tokens</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginCommand cmd, CancellationToken ct)
    {
        var result = await mediator.Send(cmd, ct);
        Response.Cookies.Append("refresh_token", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure   = true,
            SameSite = SameSiteMode.Strict,
            Expires  = DateTimeOffset.UtcNow.AddDays(7),
        });
        return Ok(new
        {
            result.AccessToken,
            result.UserId,
            result.FullName,
            result.Email,
            result.Role,
            result.Permissions,
            result.TenantId,
        });
    }

    /// <summary>Refresh access token using refresh token cookie</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies["refresh_token"]
            ?? throw new UnauthorizedAccessException("Refresh token مفقود");
        var result = await mediator.Send(new RefreshTokenCommand(refreshToken), ct);
        Response.Cookies.Append("refresh_token", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true, Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires  = DateTimeOffset.UtcNow.AddDays(7),
        });
        return Ok(new { result.AccessToken });
    }

    /// <summary>Logout — clear refresh token cookie</summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("refresh_token");
        return NoContent();
    }

    /// <summary>Get current user profile</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
        => Ok(await mediator.Send(new GetMeQuery(), ct));
}
