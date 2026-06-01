using MediatR;
using WinCraft.Domain.Entities;

namespace WinCraft.Domain.Events;

public record QuotationApprovedEvent(
    Guid TenantId,
    Guid QuotationId,
    Guid CustomerId,
    string ProjectName,
    DateOnly? ExpectedDelivery,
    List<Design> Designs,
    Guid SeriesId,
    Guid? EngineerUserId
) : INotification;

public record WorkOrderCompletedEvent(
    Guid TenantId,
    Guid WorkOrderId,
    string WorkOrderCode
) : INotification;

public record QuotationOpenedEvent(
    Guid TenantId,
    Guid QuotationId,
    string Token
) : INotification;

public record LowStockDetectedEvent(
    Guid TenantId,
    Guid ItemId,
    string ItemCode,
    decimal CurrentStock,
    decimal MinStock
) : INotification;
