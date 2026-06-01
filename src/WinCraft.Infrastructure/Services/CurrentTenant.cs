using WinCraft.Application.Common.Interfaces;

namespace WinCraft.Infrastructure.Services;

public class CurrentTenant : ICurrentTenant
{
    private Guid _tenantId;
    public Guid Id => _tenantId;
    public void Set(Guid tenantId) => _tenantId = tenantId;
}
