using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.Projects;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetProjectsQuery q, CancellationToken ct)
        => Ok(await mediator.Send(q, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetProjectQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateProjectStatusCommand(id, req.Status), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/payments")]
    public async Task<IActionResult> AddPayment(Guid id, [FromBody] AddPaymentRequest req, CancellationToken ct)
    {
        var payId = await mediator.Send(
            new AddPaymentCommand(id, req.Amount, req.Description, req.Notes), ct);
        return Ok(new { id = payId });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteProjectCommand(id), ct);
        return NoContent();
    }
}

public record UpdateStatusRequest(string Status);
public record AddPaymentRequest(decimal Amount, string? Description, string? Notes);
