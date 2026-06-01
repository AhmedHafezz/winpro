using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Infrastructure.BackgroundJobs;
using WinCraft.Infrastructure.Hubs;
using WinCraft.Infrastructure.Persistence;
using WinCraft.Infrastructure.Services;

namespace WinCraft.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connString = configuration.GetConnectionString("Default")!;

        services.AddDbContext<WinCraftDbContext>(opts =>
            opts.UseNpgsql(connString));

        services.AddScoped<IApplicationDbContext>(sp =>
            sp.GetRequiredService<WinCraftDbContext>());

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<ICurrentTenant, CurrentTenant>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICodeGeneratorService, CodeGeneratorService>();
        services.AddScoped<IQrCodeService, QrCodeService>();
        services.AddScoped<IPdfService, PdfService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<LowStockAlertJob>();

        services.AddHangfire(cfg => cfg
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(c => c.UseNpgsqlClientFactory(connString)));

        services.AddHangfireServer();

        return services;
    }
}
