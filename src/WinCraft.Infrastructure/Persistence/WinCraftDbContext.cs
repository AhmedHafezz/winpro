using System.Linq.Expressions;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Domain.Entities;

namespace WinCraft.Infrastructure.Persistence;

public class WinCraftDbContext(
    DbContextOptions<WinCraftDbContext> options,
    ICurrentTenant currentTenant)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Deal> Deals => Set<Deal>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<ProfileSeries> ProfileSeries => Set<ProfileSeries>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<ProfileFinishPrice> ProfileFinishPrices => Set<ProfileFinishPrice>();
    public DbSet<GlassType> GlassTypes => Set<GlassType>();
    public DbSet<Finish> Finishes => Set<Finish>();
    public DbSet<Fitting> Fittings => Set<Fitting>();
    public DbSet<FittingsKit> FittingsKits => Set<FittingsKit>();
    public DbSet<Treatment> Treatments => Set<Treatment>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<Design> Designs => Set<Design>();
    public DbSet<DesignPanel> DesignPanels => Set<DesignPanel>();
    public DbSet<BomCalculation> BomCalculations => Set<BomCalculation>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectDocument> ProjectDocuments => Set<ProjectDocument>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<WorkOrderItem> WorkOrderItems => Set<WorkOrderItem>();
    public DbSet<CutJob> CutJobs => Set<CutJob>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<OffCut> OffCuts => Set<OffCut>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveyItem> SurveyItems => Set<SurveyItem>();
    public DbSet<Dispatch> Dispatches => Set<Dispatch>();
    public DbSet<InstallationJob> InstallationJobs => Set<InstallationJob>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WinCraftDbContext).Assembly);

        // Global tenant query filter
        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
            .Where(t => typeof(TenantEntity).IsAssignableFrom(t.ClrType)))
        {
            var parameter  = Expression.Parameter(entityType.ClrType, "e");
            var tenantProp = Expression.Property(parameter, nameof(TenantEntity.TenantId));
            var tenantVal  = Expression.Constant(currentTenant.Id);
            var body       = Expression.Equal(tenantProp, tenantVal);
            var filter     = Expression.Lambda(body, parameter);
            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
