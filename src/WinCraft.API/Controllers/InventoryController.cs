using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.Inventory;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetInventoryQuery q, CancellationToken ct)
        => Ok(await mediator.Send(q, ct));

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock(CancellationToken ct)
        => Ok(await mediator.Send(new GetLowStockQuery(), ct));

    [HttpGet("off-cuts")]
    public async Task<IActionResult> GetOffCuts([FromQuery] bool? usable, CancellationToken ct)
        => Ok(await mediator.Send(new GetOffCutsQuery(usable), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInventoryItemCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(GetAll), new { id }, new { id });
    }

    [HttpPost("movements")]
    public async Task<IActionResult> AddMovement([FromBody] AddStockMovementCommand cmd, CancellationToken ct)
    {
        await mediator.Send(cmd, ct);
        return NoContent();
    }

    [HttpPost("off-cuts/{id:guid}/use")]
    public async Task<IActionResult> UseOffCut(Guid id, [FromBody] UseOffCutRequest req, CancellationToken ct)
    {
        await mediator.Send(new UseOffCutCommand(id, req.JobRef), ct);
        return NoContent();
    }
}

public record UseOffCutRequest(string? JobRef);
