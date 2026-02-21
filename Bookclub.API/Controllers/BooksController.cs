using BookClubApp.Data;
using BookClubApp.DTOs;
using BookClubApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookClubApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BooksController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public BooksController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var books = await _db.Books
            .Select(b => new BookDto(b.BId, b.AuthorFirst, b.AuthorLast, b.Title, b.PublishDate, b.ISBN))
            .ToListAsync();
        return Ok(books);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var b = await _db.Books.FindAsync(id);
        if (b == null) return NotFound();
        return Ok(new BookDto(b.BId, b.AuthorFirst, b.AuthorLast, b.Title, b.PublishDate, b.ISBN));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookDto dto)
    {
        var book = new Book
        {
            AuthorFirst = dto.AuthorFirst,
            AuthorLast = dto.AuthorLast,
            Title = dto.Title,
            PublishDate = dto.PublishDate,
            ISBN = dto.ISBN
        };
        _db.Books.Add(book);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = book.BId },
            new BookDto(book.BId, book.AuthorFirst, book.AuthorLast, book.Title, book.PublishDate, book.ISBN));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateBookDto dto)
    {
        var book = await _db.Books.FindAsync(id);
        if (book == null) return NotFound();

        book.AuthorFirst = dto.AuthorFirst;
        book.AuthorLast = dto.AuthorLast;
        book.Title = dto.Title;
        book.PublishDate = dto.PublishDate;
        book.ISBN = dto.ISBN;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _db.Books.FindAsync(id);
        if (book == null) return NotFound();
        _db.Books.Remove(book);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
