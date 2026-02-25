// Controllers/GroupBookReviewsController.cs
using BookClubApp.Data;
using BookClubApp.DTOs;
using BookClubApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookClubApp.Controllers;

[ApiController]
[Authorize]
[Route("api/groups/{groupId:int}/books/{gbId:int}/reviews")]
public class GroupBookReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsSiteAdmin => User.IsInRole("Admin");

    public GroupBookReviewsController(ApplicationDbContext db) => _db = db;

    private static bool IsRatingValid(decimal rating) => rating >= 0m && rating <= 5m;

    private static string? NormalizeComment(string? comment)
    {
        var c = (comment ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(c) ? null : c;
    }

    private async Task<Group?> GetGroup(int groupId)
        => await _db.Groups.AsNoTracking().FirstOrDefaultAsync(g => g.GroupID == groupId);

    private async Task<bool> GroupBookExists(int groupId, int gbId)
        => await _db.GroupBooks.AnyAsync(gb => gb.GBID == gbId && gb.GroupID == groupId);

    private async Task<bool> IsAcceptedMember(int groupId, string userId)
        => await _db.UserGroups.AnyAsync(ug =>
            ug.GroupID == groupId &&
            ug.UserID == userId &&
            ug.Status == UserGroupStatus.Accepted);

    private bool IsGroupAdmin(Group g) => g.AdminID == CurrentUserId;

    private async Task<bool> CanViewOrReview(Group g, int groupId)
        => IsSiteAdmin || IsGroupAdmin(g) || await IsAcceptedMember(groupId, CurrentUserId);

    private bool CanModerate(Group g) => IsSiteAdmin || IsGroupAdmin(g);

    // GET /api/groups/{groupId}/books/{gbId}/reviews
    [HttpGet]
    public async Task<IActionResult> GetAll(int groupId, int gbId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Group not found.");

        if (!await GroupBookExists(groupId, gbId))
            return NotFound("Group book not found.");

        if (!await CanViewOrReview(group, groupId))
            return Forbid();

        var reviews = await _db.GroupBookReviews
            .Where(r => r.GBID == gbId)
            .Include(r => r.User)
            .OrderByDescending(r => r.UpdatedAt)
            .Select(r => new GroupBookReviewDto(
                r.ReviewId,
                r.GBID,
                r.UserID,
                (r.User.FName + " " + r.User.LName).Trim(),
                r.Rating,
                r.Comment,
                r.CreatedAt,
                r.UpdatedAt
            ))
            .ToListAsync();

        return Ok(reviews);
    }

    // PUT /api/groups/{groupId}/books/{gbId}/reviews/me
    [HttpPut("me")]
    public async Task<IActionResult> UpsertMine(int groupId, int gbId, [FromBody] UpsertGroupBookReviewDto dto)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Group not found.");

        if (!await GroupBookExists(groupId, gbId))
            return NotFound("Group book not found.");

        if (!await CanViewOrReview(group, groupId))
            return Forbid();

        if (!IsRatingValid(dto.Rating))
            return BadRequest(new { message = "Rating must be between 0 and 5." });

        var comment = NormalizeComment(dto.Comment);

        var existing = await _db.GroupBookReviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.GBID == gbId && r.UserID == CurrentUserId);

        if (existing == null)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == CurrentUserId);
            if (user == null) return Unauthorized();

            var review = new GroupBookReview
            {
                GBID = gbId,
                UserID = CurrentUserId,
                Rating = dto.Rating,
                Comment = comment,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.GroupBookReviews.Add(review);
            await _db.SaveChangesAsync();

            return Ok(new GroupBookReviewDto(
                review.ReviewId,
                review.GBID,
                review.UserID,
                (user.FName + " " + user.LName).Trim(),
                review.Rating,
                review.Comment,
                review.CreatedAt,
                review.UpdatedAt
            ));
        }
        else
        {
            existing.Rating = dto.Rating;
            existing.Comment = comment;
            existing.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new GroupBookReviewDto(
                existing.ReviewId,
                existing.GBID,
                existing.UserID,
                (existing.User.FName + " " + existing.User.LName).Trim(),
                existing.Rating,
                existing.Comment,
                existing.CreatedAt,
                existing.UpdatedAt
            ));
        }
    }

    // DELETE /api/groups/{groupId}/books/{gbId}/reviews/me
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMine(int groupId, int gbId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Group not found.");

        if (!await GroupBookExists(groupId, gbId))
            return NotFound("Group book not found.");

        if (!await CanViewOrReview(group, groupId))
            return Forbid();

        var review = await _db.GroupBookReviews
            .FirstOrDefaultAsync(r => r.GBID == gbId && r.UserID == CurrentUserId);

        if (review == null) return NotFound();

        _db.GroupBookReviews.Remove(review);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/groups/{groupId}/books/{gbId}/reviews/{reviewId}
    // Moderator delete: group admin or site Admin
    [HttpDelete("{reviewId:int}")]
    public async Task<IActionResult> DeleteReview(int groupId, int gbId, int reviewId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Group not found.");

        if (!await GroupBookExists(groupId, gbId))
            return NotFound("Group book not found.");

        if (!CanModerate(group))
            return Forbid();

        var review = await _db.GroupBookReviews
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.GBID == gbId);

        if (review == null) return NotFound();

        _db.GroupBookReviews.Remove(review);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}