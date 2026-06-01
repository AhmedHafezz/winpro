using MediatR;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;
using WinCraft.Domain.Events;

namespace WinCraft.Application.Features.Projects;

public class QuotationApprovedHandler(
    IApplicationDbContext db,
    IBomEngine bomEngine,
    INotificationService notifs,
    ICodeGeneratorService codes)
    : INotificationHandler<QuotationApprovedEvent>
{
    public async Task Handle(QuotationApprovedEvent e, CancellationToken ct)
    {
        var project = new Project
        {
            TenantId    = e.TenantId,
            QuotationId = e.QuotationId,
            CustomerId  = e.CustomerId,
            Name        = e.ProjectName,
            Status      = ProjectStatus.Active,
            DueDate     = e.ExpectedDelivery,
        };
        await db.Projects.AddAsync(project, ct);

        foreach (var design in e.Designs)
        {
            design.ProjectId   = project.Id;
            design.QuotationId = null;
        }

        if (e.SeriesId != Guid.Empty)
        {
            var bom = await bomEngine.CalculateAsync(e.Designs, e.SeriesId, ct);
            var bomCalc = new BomCalculation
            {
                TenantId  = e.TenantId,
                ProjectId = project.Id,
                TotalBars = bom.TotalBars,
                TotalLengthM  = bom.TotalLengthM,
                TotalWeightKg = bom.TotalWeightKg,
                UsagePct      = bom.AvgUsagePct,
                RecoverablePct = bom.AvgRecoverPct,
                ScrapPct      = bom.ScrapPct,
            };
            await db.BomCalculations.AddAsync(bomCalc, ct);
        }

        var woCode = await codes.NextAsync("WO", e.TenantId, ct);
        var wo = new WorkOrder
        {
            TenantId  = e.TenantId,
            ProjectId = project.Id,
            Code      = woCode,
            Status    = WorkOrderStatus.Pending,
            DueDate   = e.ExpectedDelivery,
        };
        await db.WorkOrders.AddAsync(wo, ct);

        await db.SaveChangesAsync(ct);

        if (e.EngineerUserId.HasValue)
            await notifs.SendAsync(e.TenantId, e.EngineerUserId, new Notification
            {
                TenantId = e.TenantId,
                UserId   = e.EngineerUserId,
                Type     = NotifType.WorkOrderCreated,
                Title    = "أمر تصنيع جديد",
                Message  = $"مشروع {project.Name} جاهز للإنتاج",
                Module   = "shopfloor",
                EntityId = wo.Id,
            }, ct);
    }
}
