using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WinCraft.Domain.Entities;

namespace WinCraft.Infrastructure.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> b)
    {
        b.ToTable("Tenants");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.Subdomain).HasMaxLength(100);
        b.Property(x => x.TaxRate).HasColumnType("decimal(5,2)");
    }
}

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> b)
    {
        b.ToTable("Roles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.Permissions)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions?)null) ?? [])
            .HasColumnType("jsonb");
    }
}

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("Users");
        b.HasKey(x => x.Id);
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.Email).HasMaxLength(200).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        b.Property(x => x.Phone).HasMaxLength(50);
        b.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
        b.HasOne(x => x.Tenant).WithMany(t => t.Users).HasForeignKey(x => x.TenantId);
        b.HasOne(x => x.Role).WithMany(r => r.Users).HasForeignKey(x => x.RoleId);
    }
}

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> b)
    {
        b.ToTable("Customers");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(300).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(50);
        b.HasIndex(x => x.TenantId);
    }
}

public class DealConfiguration : IEntityTypeConfiguration<Deal>
{
    public void Configure(EntityTypeBuilder<Deal> b)
    {
        b.ToTable("Deals");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(300).IsRequired();
        b.Property(x => x.Value).HasColumnType("decimal(12,3)");
        b.Property(x => x.Stage).HasConversion<string>().HasMaxLength(50);
        b.HasOne(x => x.Customer).WithMany(c => c.Deals).HasForeignKey(x => x.CustomerId);
    }
}

public class ProfileSeriesConfiguration : IEntityTypeConfiguration<ProfileSeries>
{
    public void Configure(EntityTypeBuilder<ProfileSeries> b)
    {
        b.ToTable("ProfileSeries");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.LaborRatePerSqm).HasColumnType("decimal(10,3)");

        b.HasOne(x => x.FrameProfile).WithMany().HasForeignKey(x => x.FrameProfileId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.SashProfile).WithMany().HasForeignKey(x => x.SashProfileId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.MullionProfile).WithMany().HasForeignKey(x => x.MullionProfileId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.TransomProfile).WithMany().HasForeignKey(x => x.TransomProfileId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.BeadProfile).WithMany().HasForeignKey(x => x.BeadProfileId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.CleatProfile).WithMany().HasForeignKey(x => x.CleatProfileId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.ThresholdProfile).WithMany().HasForeignKey(x => x.ThresholdProfileId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> b)
    {
        b.ToTable("Profiles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.WeightPerMeter).HasColumnType("decimal(8,4)");
        b.HasOne(x => x.Series).WithMany(s => s.Profiles).HasForeignKey(x => x.SeriesId);
    }
}

public class ProfileFinishPriceConfiguration : IEntityTypeConfiguration<ProfileFinishPrice>
{
    public void Configure(EntityTypeBuilder<ProfileFinishPrice> b)
    {
        b.ToTable("ProfileFinishPrices");
        b.HasKey(x => x.Id);
        b.Property(x => x.PricePerMeter).HasColumnType("decimal(10,3)");
        b.HasOne(x => x.Profile).WithMany(p => p.FinishPrices).HasForeignKey(x => x.ProfileId);
    }
}

public class GlassTypeConfiguration : IEntityTypeConfiguration<GlassType>
{
    public void Configure(EntityTypeBuilder<GlassType> b)
    {
        b.ToTable("GlassTypes");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.PricePerSqm).HasColumnType("decimal(10,3)");
        b.Property(x => x.UValue).HasColumnType("decimal(5,3)");
        b.Property(x => x.TotalThickness).HasColumnType("decimal(5,2)");
        b.Property(x => x.WeightPerSqm).HasColumnType("decimal(5,2)");
    }
}

public class FinishConfiguration : IEntityTypeConfiguration<Finish>
{
    public void Configure(EntityTypeBuilder<Finish> b)
    {
        b.ToTable("Finishes");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.PremiumPct).HasColumnType("decimal(5,2)");
    }
}

public class FittingConfiguration : IEntityTypeConfiguration<Fitting>
{
    public void Configure(EntityTypeBuilder<Fitting> b)
    {
        b.ToTable("Fittings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.UnitPrice).HasColumnType("decimal(10,3)");
    }
}

public class FittingsKitConfiguration : IEntityTypeConfiguration<FittingsKit>
{
    public void Configure(EntityTypeBuilder<FittingsKit> b)
    {
        b.ToTable("FittingsKits");
        b.HasKey(x => x.Id);
        b.Property(x => x.Items)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<FittingsKitItem[]>(v, (JsonSerializerOptions?)null) ?? [])
            .HasColumnType("jsonb");
        b.HasOne(x => x.Series).WithMany(s => s.FittingsKits).HasForeignKey(x => x.SeriesId);
    }
}

public class QuotationConfiguration : IEntityTypeConfiguration<Quotation>
{
    public void Configure(EntityTypeBuilder<Quotation> b)
    {
        b.ToTable("Quotations");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.DiscountPct).HasColumnType("decimal(5,2)");
        b.Property(x => x.TaxPct).HasColumnType("decimal(5,2)");
        b.Property(x => x.TotalValue).HasColumnType("decimal(12,3)");
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
        b.HasIndex(x => x.SmartLinkToken).IsUnique().HasFilter("\"SmartLinkToken\" IS NOT NULL");
        b.HasIndex(x => x.TenantId);
        b.HasOne(x => x.Customer).WithMany(c => c.Quotations).HasForeignKey(x => x.CustomerId);
    }
}

public class DesignConfiguration : IEntityTypeConfiguration<Design>
{
    public void Configure(EntityTypeBuilder<Design> b)
    {
        b.ToTable("Designs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(20).IsRequired();
        b.HasIndex(x => x.QuotationId);
        b.HasOne(x => x.Quotation).WithMany(q => q.Designs).HasForeignKey(x => x.QuotationId);
        b.HasOne(x => x.Series).WithMany().HasForeignKey(x => x.SeriesId);
        b.HasOne(x => x.GlassType).WithMany().HasForeignKey(x => x.GlassTypeId);
        b.HasOne(x => x.Finish).WithMany().HasForeignKey(x => x.FinishId);
    }
}

public class DesignPanelConfiguration : IEntityTypeConfiguration<DesignPanel>
{
    public void Configure(EntityTypeBuilder<DesignPanel> b)
    {
        b.ToTable("DesignPanels");
        b.HasKey(x => x.Id);
        b.Property(x => x.WidthRatio).HasColumnType("decimal(5,4)");
        b.HasOne(x => x.Design).WithMany(d => d.Panels).HasForeignKey(x => x.DesignId);
    }
}

public class TreatmentConfiguration : IEntityTypeConfiguration<Treatment>
{
    public void Configure(EntityTypeBuilder<Treatment> b)
    {
        b.ToTable("Treatments");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.DesignId).IsUnique();
        b.Property(x => x.UValueCalc).HasColumnType("decimal(5,3)");
        b.HasOne(x => x.Design).WithOne(d => d.Treatment).HasForeignKey<Treatment>(x => x.DesignId);
    }
}

public class BomCalculationConfiguration : IEntityTypeConfiguration<BomCalculation>
{
    public void Configure(EntityTypeBuilder<BomCalculation> b)
    {
        b.ToTable("BomCalculations");
        b.HasKey(x => x.Id);
        b.Property(x => x.TotalLengthM).HasColumnType("decimal(8,3)");
        b.Property(x => x.TotalWeightKg).HasColumnType("decimal(8,3)");
        b.Property(x => x.UsagePct).HasColumnType("decimal(5,2)");
        b.Property(x => x.RecoverablePct).HasColumnType("decimal(5,2)");
        b.Property(x => x.ScrapPct).HasColumnType("decimal(5,2)");
        b.Property(x => x.ProfilesCost).HasColumnType("decimal(12,3)");
        b.Property(x => x.GlassCost).HasColumnType("decimal(12,3)");
        b.Property(x => x.FittingsCost).HasColumnType("decimal(12,3)");
        b.Property(x => x.TotalCost).HasColumnType("decimal(12,3)");
        b.Property(x => x.ResultJson).HasColumnType("jsonb");
    }
}

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> b)
    {
        b.ToTable("Projects");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(300).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b)
    {
        b.ToTable("Payments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Amount).HasColumnType("decimal(12,3)");
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
        b.HasOne(x => x.Project).WithMany(p => p.Payments).HasForeignKey(x => x.ProjectId);
    }
}

public class WorkOrderConfiguration : IEntityTypeConfiguration<WorkOrder>
{
    public void Configure(EntityTypeBuilder<WorkOrder> b)
    {
        b.ToTable("WorkOrders");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.Priority).HasConversion<string>().HasMaxLength(50);
        b.HasIndex(x => x.ProjectId);
        b.HasOne(x => x.Project).WithMany(p => p.WorkOrders).HasForeignKey(x => x.ProjectId);
    }
}

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> b)
    {
        b.ToTable("InventoryItems");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.Price).HasColumnType("decimal(10,3)");
        b.Property(x => x.MinStock).HasColumnType("decimal(10,3)");
        b.Property(x => x.CurrentStock).HasColumnType("decimal(10,3)");
    }
}

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> b)
    {
        b.ToTable("StockMovements");
        b.HasKey(x => x.Id);
        b.Property(x => x.Qty).HasColumnType("decimal(10,3)");
        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(50);
        b.HasIndex(x => x.ItemId);
        b.HasOne(x => x.Item).WithMany(i => i.Movements).HasForeignKey(x => x.ItemId);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(100);
        b.HasIndex(x => new { x.UserId, x.IsRead });
    }
}

public class InstallationJobConfiguration : IEntityTypeConfiguration<InstallationJob>
{
    public void Configure(EntityTypeBuilder<InstallationJob> b)
    {
        b.ToTable("InstallationJobs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.ChecklistJson)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<string[]>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? [])
            .HasColumnType("jsonb");
    }
}
