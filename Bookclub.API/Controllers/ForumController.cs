using System.Security.Claims;
using BookClubApp.Data;
using BookClubApp.DTOs;
using BookClubApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookClubApp.Controllers;

[ApiController]
[Route("api/groups/{groupId}/forum")]
[Authorize]
public class ForumController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ForumController(ApplicationDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // GET api/groups/5/forum/book
    [HttpGet("{category}")]
    public async Task<IActionResult> GetPosts(int groupId, string category)
    {
        var posts = await _db.ForumPosts
            .Where(p => p.GroupID == groupId && p.Category == category)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ForumPostDto(
                p.FpId,
                p.Category,
                p.User.UserName!,
                p.Title,
                p.Body,
                p.Body.Length > 80 ? p.Body.Substring(0, 80) + "..." : p.Body,
                p.Replies.Count,
                p.CreatedAt
            ))
            .ToListAsync();

        return Ok(posts);
    }

    // GET api/groups/5/forum/book/12
    [HttpGet("{category}/{fpId}")]
    public async Task<IActionResult> GetPost(int groupId, int fpId)
    {
        var post = await _db.ForumPosts
            .Where(p => p.FpId == fpId && p.GroupID == groupId)
            .Select(p => new ForumPostDetailDto(
                p.FpId,
                p.Category,
                p.User.UserName!,
                p.Title,
                p.Body,
                p.Replies.Count,
                p.CreatedAt,
                p.Replies
                    .OrderBy(r => r.CreatedAt)
                    .Select(r => new ForumReplyDto(
                        r.FrId,
                        r.User.UserName!,
                        r.Body,
                        r.CreatedAt
                    ))
                    .ToList()
            ))
            .FirstOrDefaultAsync();

        return post is null ? NotFound() : Ok(post);
    }

    // POST api/groups/5/forum/book
    [HttpPost("{category}")]
    public async Task<IActionResult> CreatePost(int groupId, string category, CreatePostDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Body))
            return BadRequest("Title and body are required.");

        var post = new ForumPost
        {
            GroupID = groupId,
            UserID = UserId,
            Category = category,
            Title = dto.Title.Trim(),
            Body = dto.Body.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.ForumPosts.Add(post);
        await _db.SaveChangesAsync();

        return Ok(new { post.FpId });
    }

    // POST api/groups/5/forum/book/12/replies
    [HttpPost("{category}/{fpId}/replies")]
    public async Task<IActionResult> CreateReply(int groupId, int fpId, CreateReplyDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Body))
            return BadRequest("Reply body is required.");

        var postExists = await _db.ForumPosts
            .AnyAsync(p => p.FpId == fpId && p.GroupID == groupId);

        if (!postExists) return NotFound();

        var reply = new ForumReply
        {
            PostID = fpId,
            UserID = UserId,
            Body = dto.Body.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.ForumReplies.Add(reply);
        await _db.SaveChangesAsync();

        return Ok(new { reply.FrId });
    }

    // DELETE api/groups/5/forum/book/12
    [HttpDelete("{category}/{fpId}")]
    public async Task<IActionResult> DeletePost(int groupId, int fpId)
    {
        var post = await _db.ForumPosts
            .FirstOrDefaultAsync(p => p.FpId == fpId && p.GroupID == groupId);

        if (post is null) return NotFound();
        if (post.UserID != UserId) return Forbid();

        _db.ForumPosts.Remove(post);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}