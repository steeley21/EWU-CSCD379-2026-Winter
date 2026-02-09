using Microsoft.AspNetCore.Mvc;

namespace Hivefall_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    [HttpGet("ping")]
    public async Task<IActionResult> Ping()
    {
        await Task.CompletedTask;
        return Ok(new
        {
            message = "pong",
            serverTimeUtc = DateTime.UtcNow
        });
    }
}