namespace WinCraft.Application.Common.Interfaces;

public interface ICurrentTenant
{
    Guid Id { get; }
    void Set(Guid tenantId);
}
