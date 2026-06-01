using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Application.Features.Quotations;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/quotations")]
[Authorize]
public class QuotationsController(IMediator mediator, IPdfService pdfService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status, [FromQuery] Guid? customerId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetQuotationsQuery(status, customerId, page, pageSize), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetQuotationQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuotationCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPost("{id:guid}/send")]
    public async Task<IActionResult> Send(Guid id, CancellationToken ct)
    {
        await mediator.Send(new SendQuotationCommand(id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest req, CancellationToken ct)
    {
        await mediator.Send(new ApproveQuotationCommand(id, req.ExpectedDelivery), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest req, CancellationToken ct)
    {
        await mediator.Send(new RejectQuotationCommand(id, req.Reason), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<IActionResult> Duplicate(Guid id, CancellationToken ct)
    {
        var newId = await mediator.Send(new DuplicateQuotationCommand(id), ct);
        return Ok(new { id = newId });
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> Pdf(Guid id, CancellationToken ct)
    {
        var bytes = await pdfService.GenerateQuotationPdfAsync(id, ct);
        return File(bytes, "application/pdf", $"quotation-{id}.pdf");
    }

    [HttpGet("smart-link/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByToken(string token, CancellationToken ct)
        => Ok(await mediator.Send(new OpenSmartLinkCommand(token), ct));

    public record ApproveRequest(DateOnly? ExpectedDelivery);
    public record RejectRequest(string? Reason);
}
