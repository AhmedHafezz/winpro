using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.WorkOrders;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/work-orders")]
[Authorize]
public class WorkOrdersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetWorkOrdersQuery q, CancellationToken ct)
        => Ok(await mediator.Send(q, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetWorkOrderQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkOrderCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPatch("{id:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(Guid id, [FromBody] UpdateProgressRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateWorkOrderProgressCommand(id, req.ItemId, req.Progress), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new CompleteWorkOrderCommand(id), ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/cut-plan")]
    public async Task<IActionResult> GetCutPlan(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetCutPlanQuery(id), ct));

    [HttpGet("{id:guid}/qr-codes")]
    public async Task<IActionResult> GetQrCodes(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetQrCodesQuery(id), ct));

    [HttpPost("scan")]
    public async Task<IActionResult> ScanQr([FromBody] ScanQrCommand cmd, CancellationToken ct)
    {
        await mediator.Send(cmd, ct);
        return NoContent();
    }
}

public record UpdateProgressRequest(Guid ItemId, int Progress);
