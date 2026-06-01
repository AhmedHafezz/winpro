using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.FieldOps;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/dispatches")]
[Authorize]
public class DispatchesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetDispatchesQuery q, CancellationToken ct)
        => Ok(await mediator.Send(q, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetDispatchQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDispatchCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPost("{id:guid}/deliver")]
    public async Task<IActionResult> Deliver(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeliverDispatchCommand(id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid id, CancellationToken ct)
    {
        await mediator.Send(new ConfirmDispatchCommand(id), ct);
        return NoContent();
    }
}
