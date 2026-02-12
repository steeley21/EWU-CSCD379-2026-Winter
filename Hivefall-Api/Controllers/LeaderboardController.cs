using Hivefall_Api.Dto;
using Hivefall_Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Hivefall_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _service;

    public LeaderboardController(ILeaderboardService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetTop([FromQuery] int limit = 25)
    {
        try
        {
            var entries = await _service.GetTopAsync(limit);
            return Ok(new { entries, serverTimeUtc = DateTime.UtcNow });
        }
        catch (SqlException)
        {
            return StatusCode(503, new { message = "Leaderboard is waking up. Try again in a moment." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] CreateRunResultDto dto)
    {
        var created = await _service.SubmitAsync(dto);
        return CreatedAtAction(nameof(GetTop), new { limit = 25 }, created);
    }
}