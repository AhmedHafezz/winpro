using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Application.Features.BOM;

namespace WinCraft.API.Controllers;

[ApiController]
[Route("api/bom")]
[Authorize]
public class BomController(IMediator mediator, IPdfService pdfService) : ControllerBase
{
    [HttpPost("calculate")]
    public async Task<IActionResult> Calculate([FromBody] CalculateBomCommand cmd, CancellationToken ct)
        => Ok(await mediator.Send(cmd, ct));

    [HttpGet("{bomId:guid}")]
    public async Task<IActionResult> Get(Guid bomId, CancellationToken ct)
        => Ok(await mediator.Send(new GetBomQuery(bomId), ct));

    [HttpGet("{bomId:guid}/pdf")]
    public async Task<IActionResult> Pdf(Guid bomId, CancellationToken ct)
    {
        var bytes = await pdfService.GenerateBomPdfAsync(bomId, ct);
        return File(bytes, "application/pdf", $"bom-{bomId}.pdf");
    }
}
