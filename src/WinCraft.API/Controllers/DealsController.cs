using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.Customers;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/deals")]
[Authorize]
public class DealsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? stage, [FromQuery] Guid? customerId, CancellationToken ct)
        => Ok(await mediator.Send(new GetDealsQuery(stage, customerId), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDealCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return Ok(new { id });
    }

    [HttpPut("{id:guid}/stage")]
    public async Task<IActionResult> UpdateStage(Guid id, [FromBody] UpdateStageRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateDealStageCommand(id, req.Stage), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteDealCommand(id), ct);
        return NoContent();
    }

    public record UpdateStageRequest(string Stage);
}
