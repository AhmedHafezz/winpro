using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Enums;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController(IApplicationDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken ct)
    {
        var activeQuotations  = await db.Quotations.CountAsync(q => !q.IsDeleted && q.Status == QuotationStatus.Draft || q.Status == QuotationStatus.Sent, ct);
        var activeProjects     = await db.Projects.CountAsync(p => !p.IsDeleted && p.Status == ProjectStatus.Active, ct);
        var pendingWorkOrders  = await db.WorkOrders.CountAsync(w => !w.IsDeleted && w.Status == WorkOrderStatus.Pending, ct);
        var totalSales         = await db.Quotations
            .Where(q => !q.IsDeleted && q.Status == QuotationStatus.Accepted)
            .SumAsync(q => q.TotalValue, ct);

        return Ok(new
        {
            activeQuotations,
            activeProjects,
            pendingWorkOrders,
            totalSales,
        });
    }
}
