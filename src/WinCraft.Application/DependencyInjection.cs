using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using WinCraft.Application.Common.Behaviors;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Application.Features.BOM;

namespace WinCraft.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddAutoMapper(assembly);

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(AuditBehavior<,>));

        services.AddScoped<IBomEngine, BomEngine>();

        return services;
    }
}
