namespace WinCraft.Application.Common.Interfaces;

public interface ICurrentUser
{
    Guid Id { get; }
    Guid TenantId { get; }
    string Email { get; }
    string Name { get; }
    string Role { get; }
    string[] Permissions { get; }
    bool IsAuthenticated { get; }
    bool HasPermission(string permission);
}
