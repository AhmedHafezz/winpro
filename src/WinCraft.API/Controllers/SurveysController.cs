using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Features.Surveys;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/surveys")]
[Authorize]
public class SurveysController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetSurveysQuery q, CancellationToken ct)
        => Ok(await mediator.Send(q, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetSurveyQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSurveyCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPost("{id:guid}/items")]
    public async Task<IActionResult> AddItem(Guid id, [FromBody] AddSurveyItemRequest req, CancellationToken ct)
    {
        var itemId = await mediator.Send(
            new AddSurveyItemCommand(id, req.Description, req.WidthMm, req.HeightMm,
                req.Qty, req.Location, req.Notes), ct);
        return Ok(new { id = itemId });
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        await mediator.Send(new SubmitSurveyCommand(id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/convert-to-quotation")]
    public async Task<IActionResult> ConvertToQuotation(Guid id, CancellationToken ct)
    {
        var quotationId = await mediator.Send(new ConvertSurveyToQuotationCommand(id), ct);
        return Ok(new { quotationId });
    }
}

public record AddSurveyItemRequest(
    string? Description, double WidthMm, double HeightMm,
    int Qty, string? Location, string? Notes);
