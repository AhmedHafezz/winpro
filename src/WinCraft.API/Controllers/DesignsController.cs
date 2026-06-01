using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.Designs;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/designs")]
[Authorize]
public class DesignsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetByQuotation([FromQuery] Guid quotationId, CancellationToken ct)
        => Ok(await mediator.Send(new GetDesignsByQuotationQuery(quotationId), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetDesignQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDesignCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDesignRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateDesignCommand(
            id, req.Name, req.SeriesId, req.WidthMm, req.HeightMm,
            req.Qty, req.UnitPrice, req.Notes), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<IActionResult> Duplicate(Guid id, [FromBody] DuplicateRequest? req, CancellationToken ct)
    {
        var newId = await mediator.Send(new DuplicateDesignCommand(id, req?.Qty), ct);
        return Ok(new { id = newId });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteDesignCommand(id), ct);
        return NoContent();
    }
}

public record UpdateDesignRequest(
    string? Name, Guid? SeriesId, double WidthMm, double HeightMm,
    int Qty, decimal UnitPrice, string? Notes);

public record DuplicateRequest(int? Qty);
