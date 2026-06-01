using Microsoft.EntityFrameworkCore;
using WinCraft.Domain.Entities;
using WinCraft.Shared.Constants;

namespace WinCraft.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(WinCraftDbContext db)
    {
        await db.Database.MigrateAsync();

        // Roles
        if (!await db.Roles.AnyAsync())
        {
            foreach (var (name, perms) in DefaultRoles.All)
            {
                await db.Roles.AddAsync(new Role
                {
                    Name        = name,
                    NameAr      = TranslateRole(name),
                    Permissions = perms,
                });
            }
            await db.SaveChangesAsync();
        }

        // Demo Tenant + Admin User
        if (!await db.Tenants.AnyAsync())
        {
            var tenant = new Tenant
            {
                Name      = "WinCraft Demo",
                Subdomain = "demo",
                Plan      = "Pro",
                IsActive  = true,
            };
            await db.Tenants.AddAsync(tenant);
            await db.SaveChangesAsync();

            var adminRole = await db.Roles.FirstAsync(r => r.Name == "SuperAdmin");
            var admin = new User
            {
                TenantId     = tenant.Id,
                FullName     = "مدير النظام",
                Email        = "admin@wincraft.demo",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                RoleId       = adminRole.Id,
                IsActive     = true,
            };
            await db.Users.AddAsync(admin);

            // DOUS_50 series
            var series = new ProfileSeries
            {
                TenantId     = tenant.Id,
                Code         = "DOUS_50",
                Name         = "Dousari 50mm Series",
                Manufacturer = "DOUSARI",
                SystemType   = "Casement",
                NominalWidth = 50,
                FrameThickness = 142,
                SashThickness  = 82,
                GlassRebate    = 18,
                IsActive     = true,
            };
            await db.ProfileSeries.AddAsync(series);
            await db.SaveChangesAsync();

            var frame = new Profile
            {
                SeriesId      = series.Id,
                Code          = "27884",
                Description   = "Frame With Architrave",
                DescriptionAr = "إطار مع أرشيتراف",
                Role          = "frame",
                WeightPerMeter = 1.85m,
                BarLength     = 6000,
                CutAngleLeft  = 45,
                CutAngleRight = 45,
                IsActive      = true,
            };
            var sash = new Profile
            {
                SeriesId      = series.Id,
                Code          = "27885",
                Description   = "Sash Profile",
                DescriptionAr = "إطار المفتاح",
                Role          = "sash",
                WeightPerMeter = 1.42m,
                BarLength     = 6000,
                CutAngleLeft  = 45,
                CutAngleRight = 45,
                IsActive      = true,
            };
            await db.Profiles.AddRangeAsync(frame, sash);
            await db.SaveChangesAsync();

            series.FrameProfileId = frame.Id;
            series.SashProfileId  = sash.Id;

            // Sample glass types
            await db.GlassTypes.AddRangeAsync(
                new GlassType
                {
                    TenantId      = tenant.Id,
                    Code          = "6_CLEAR",
                    Name          = "6mm Clear",
                    Composition   = "6mm Clear Float",
                    TotalThickness = 6,
                    PricePerSqm   = 8.500m,
                    WeightPerSqm  = 15,
                    IsActive      = true,
                },
                new GlassType
                {
                    TenantId      = tenant.Id,
                    Code          = "6_20_6_DGU",
                    Name          = "6+20+6 Double Glazing",
                    Composition   = "6mm Clear + 20mm Air + 6mm Clear",
                    TotalThickness = 32,
                    UValue        = 2.8m,
                    PricePerSqm   = 22.000m,
                    WeightPerSqm  = 30,
                    IsActive      = true,
                }
            );

            // Finishes
            await db.Finishes.AddRangeAsync(
                new Finish { Code = "POWDER_WHITE",  Name = "Powder Coated White",  NameAr = "باودر أبيض",   HexColor = "#FFFFFF" },
                new Finish { Code = "POWDER_BLACK",  Name = "Powder Coated Black",  NameAr = "باودر أسود",   HexColor = "#000000" },
                new Finish { Code = "ANODIZED_SILVER", Name = "Anodized Silver",    NameAr = "أنوديزد فضي",  HexColor = "#C0C0C0" },
                new Finish { Code = "ANODIZED_GOLD",   Name = "Anodized Gold",      NameAr = "أنوديزد ذهبي", HexColor = "#FFD700" }
            );

            await db.SaveChangesAsync();
        }
    }

    private static string TranslateRole(string name) => name switch
    {
        "SuperAdmin" => "مدير النظام",
        "Manager"    => "مدير",
        "SalesRep"   => "مندوب مبيعات",
        "Engineer"   => "مهندس",
        "Warehouse"  => "مستودع",
        "Installer"  => "فني تركيب",
        "Viewer"     => "مشاهد",
        _            => name,
    };
}
