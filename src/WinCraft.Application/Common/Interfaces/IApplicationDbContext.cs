using Microsoft.EntityFrameworkCore;
using WinCraft.Domain.Entities;

namespace WinCraft.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<Role> Roles { get; }
    DbSet<User> Users { get; }
    DbSet<Customer> Customers { get; }
    DbSet<Deal> Deals { get; }
    DbSet<Activity> Activities { get; }
    DbSet<ProfileSeries> ProfileSeries { get; }
    DbSet<Profile> Profiles { get; }
    DbSet<ProfileFinishPrice> ProfileFinishPrices { get; }
    DbSet<GlassType> GlassTypes { get; }
    DbSet<Finish> Finishes { get; }
    DbSet<Fitting> Fittings { get; }
    DbSet<FittingsKit> FittingsKits { get; }
    DbSet<Treatment> Treatments { get; }
    DbSet<Quotation> Quotations { get; }
    DbSet<Design> Designs { get; }
    DbSet<DesignPanel> DesignPanels { get; }
    DbSet<BomCalculation> BomCalculations { get; }
    DbSet<Project> Projects { get; }
    DbSet<ProjectDocument> ProjectDocuments { get; }
    DbSet<Payment> Payments { get; }
    DbSet<WorkOrder> WorkOrders { get; }
    DbSet<WorkOrderItem> WorkOrderItems { get; }
    DbSet<CutJob> CutJobs { get; }
    DbSet<InventoryItem> InventoryItems { get; }
    DbSet<StockMovement> StockMovements { get; }
    DbSet<OffCut> OffCuts { get; }
    DbSet<Survey> Surveys { get; }
    DbSet<SurveyItem> SurveyItems { get; }
    DbSet<Dispatch> Dispatches { get; }
    DbSet<InstallationJob> InstallationJobs { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
