using Hivefall_Api.Dto;
using Hivefall_Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Hivefall_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _service;

    public ReviewsController(IReviewService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int limit = 5)
    {
        try
        {
            var reviews = await _service.GetTopAsync(limit);
            var totalCount = await _service.GetTotalCountAsync();
            var averageRating = await _service.GetAverageRatingAsync();

            return Ok(new
            {
                reviews,
                totalCount,
                averageRating,
                serverTimeUtc = DateTime.UtcNow
            });
        }
        catch (SqlException)
        {
            return StatusCode(503, new { message = "Reviews are waking up. Try again in a moment." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] CreateReviewDto dto)
    {
        try
        {
            var created = await _service.SubmitAsync(dto);
            return CreatedAtAction(nameof(Get), new { limit = 5 }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (SqlException)
        {
            return StatusCode(503, new { message = "Reviews are waking up. Try again in a moment." });
        }
    }
}