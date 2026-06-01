using WinCraft.Domain.Entities;
using WinCraft.Domain.Enums;

namespace WinCraft.Application.Common.Interfaces;

public interface IPdfService
{
    Task<byte[]> GenerateQuotationPdfAsync(Guid quotationId, CancellationToken ct = default);
    Task<byte[]> GenerateCuttingListPdfAsync(Guid workOrderId, CancellationToken ct = default);
    Task<byte[]> GenerateBomPdfAsync(Guid bomId, CancellationToken ct = default);
}

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string url, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string url, CancellationToken ct = default);
}

public interface INotificationService
{
    Task SendAsync(Guid tenantId, Guid? userId, Notification notification, CancellationToken ct = default);
    Task BroadcastToTenantAsync(Guid tenantId, Notification notification, CancellationToken ct = default);
}

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}

public interface IWhatsAppService
{
    Task SendMessageAsync(string phone, string message, CancellationToken ct = default);
}

public interface IQrCodeService
{
    byte[] GenerateQrCode(string content, int size = 300);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
}

public interface ICodeGeneratorService
{
    Task<string> NextAsync(string prefix, Guid tenantId, CancellationToken ct = default);
}

public interface ITokenService
{
    string GenerateAccessToken(User user, string[] permissions);
    string GenerateRefreshToken();
}
