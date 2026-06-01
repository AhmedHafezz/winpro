using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Infrastructure.Persistence;

namespace WinCraft.Infrastructure.Services;

public class CodeGeneratorService(WinCraftDbContext db) : ICodeGeneratorService
{
    public async Task<string> NextAsync(string prefix, Guid tenantId, CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var pattern = $"{prefix}-{year}-%";

        int count = prefix switch
        {
            "QT" => await db.Quotations
                .Where(q => q.TenantId == tenantId && EF.Functions.Like(q.Code, pattern))
                .CountAsync(ct),
            "WO" => await db.WorkOrders
                .Where(w => w.TenantId == tenantId && EF.Functions.Like(w.Code, pattern))
                .CountAsync(ct),
            _ => 0
        };

        return $"{prefix}-{year}-{count + 1:D3}";
    }
}
