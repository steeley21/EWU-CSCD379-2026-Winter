using BookClubApp.Data;
using BookClubApp.DTOs;
using BookClubApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookClubApp.Controllers;

[ApiController]
[Route("api/library")]
[Authorize]
public class UserLibraryController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    public UserLibraryController(ApplicationDbContext db) => _db = db;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static UserBookDto ToDto(UserBook ub) => new(
        ub.UBId,
        new BookDto(ub.Book.BId, ub.Book.AuthorFirst, ub.Book.AuthorLast,
                    ub.Book.Title, ub.Book.PublishDate, ub.Book.ISBN),
        ub.Status,
        ub.Rating,
        ub.AddedAt
    );

    // ── GET /api/library ──────────────────────────────────────────────────────
    /// Returns all books in the current user's personal library.
    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var books = await _db.UserBooks
            .Where(ub => ub.UserID == CurrentUserId)
            .Include(ub => ub.Book)
            .OrderByDescending(ub => ub.AddedAt)
            .Select(ub => ToDto(ub))
            .ToListAsync();

        return Ok(books);
    }

    // ── POST /api/library ─────────────────────────────────────────────────────
    /// Add a book (by its DB id) to the current user's library.
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddToLibraryDto dto)
    {
        var bookExists = await _db.Books.AnyAsync(b => b.BId == dto.BId);
        if (!bookExists) return NotFound(new { message = "Book not found." });

        var already = await _db.UserBooks
            .AnyAsync(ub => ub.UserID == CurrentUserId && ub.BId == dto.BId);

        if (already)
            return Conflict(new { message = "Book is already in your library." });

        var entry = new UserBook
        {
            UserID = CurrentUserId,
            BId = dto.BId,
            Status = dto.Status,
            AddedAt = DateTime.UtcNow,
        };

        _db.UserBooks.Add(entry);
        await _db.SaveChangesAsync();

        // Re-fetch with navigation so we can return the full DTO
        await _db.Entry(entry).Reference(e => e.Book).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { ubId = entry.UBId }, ToDto(entry));
    }

    // ── GET /api/library/{ubId} ───────────────────────────────────────────────
    [HttpGet("{ubId:int}")]
    public async Task<IActionResult> GetById(int ubId)
    {
        var ub = await _db.UserBooks
            .Include(ub => ub.Book)
            .FirstOrDefaultAsync(ub => ub.UBId == ubId && ub.UserID == CurrentUserId);

        if (ub == null) return NotFound();
        return Ok(ToDto(ub));
    }

    // ── PATCH /api/library/{ubId} ─────────────────────────────────────────────
    /// Update reading status and/or personal rating.
    [HttpPatch("{ubId:int}")]
    public async Task<IActionResult> Update(int ubId, [FromBody] UpdateUserBookDto dto)
    {
        var ub = await _db.UserBooks
            .Include(ub => ub.Book)
            .FirstOrDefaultAsync(ub => ub.UBId == ubId && ub.UserID == CurrentUserId);

        if (ub == null) return NotFound();

        ub.Status = dto.Status;
        ub.Rating = dto.Rating;

        await _db.SaveChangesAsync();
        return Ok(ToDto(ub));
    }

    // ── DELETE /api/library/{ubId} ────────────────────────────────────────────
    [HttpDelete("{ubId:int}")]
    public async Task<IActionResult> Remove(int ubId)
    {
        var ub = await _db.UserBooks
            .FirstOrDefaultAsync(ub => ub.UBId == ubId && ub.UserID == CurrentUserId);

        if (ub == null) return NotFound();

        _db.UserBooks.Remove(ub);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}