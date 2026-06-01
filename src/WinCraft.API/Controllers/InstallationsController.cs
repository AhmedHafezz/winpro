using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.FieldOps;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/installations")]
[Authorize]
public class InstallationsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetInstallationsQuery q, CancellationToken ct)
        => Ok(await mediator.Send(q, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetInstallationQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInstallationCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPatch("{id:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(Guid id, [FromBody] ProgressRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateInstallationProgressCommand(id, req.Progress), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new CompleteInstallationCommand(id), ct);
        return NoContent();
    }
}

public record ProgressRequest(int Progress);
