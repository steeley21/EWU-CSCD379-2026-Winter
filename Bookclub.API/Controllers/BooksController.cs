using BookClubApp.Data;
using BookClubApp.DTOs;
using BookClubApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Net;
using System.Text.Json;

namespace BookClubApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BooksController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpClientFactory _http;

    public BooksController(ApplicationDbContext db, IHttpClientFactory http)
    {
        _db = db;
        _http = http;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var books = await _db.Books
            .Select(b => new BookDto(b.BId, b.AuthorFirst, b.AuthorLast, b.Title, b.PublishDate, b.ISBN))
            .ToListAsync();
        return Ok(books);
    }

    // ✅ IMPORTANT: This prevents /api/Books/search from accidentally binding to {id}
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        q = (q ?? "").Trim();
        if (q.Length < 2)
            return Ok(Array.Empty<BookSearchResultDto>());

        // 1) DB results first
        var dbHits = await _db.Books
            .Where(b =>
                b.Title.Contains(q) ||
                b.AuthorFirst.Contains(q) ||
                b.AuthorLast.Contains(q))
            .OrderBy(b => b.Title)
            .Take(8)
            .Select(b => new BookSearchResultDto(
                b.BId,
                b.Title,
                b.AuthorFirst,
                b.AuthorLast,
                b.ISBN,
                b.PublishDate.HasValue ? b.PublishDate.Value.Year : (int?)null,
                "db"
            ))
            .ToListAsync();

        // 2) OpenLibrary results (best-effort)
        var client = _http.CreateClient();

        // IMPORTANT: request fields explicitly (ISBN is often omitted otherwise)
        var url =
            $"https://openlibrary.org/search.json?q={WebUtility.UrlEncode(q)}&limit=8" +
            $"&fields=title,author_name,first_publish_year,isbn";

        try
        {
            using var resp = await client.GetAsync(url);
            if (!resp.IsSuccessStatusCode)
                return Ok(dbHits);

            await using var stream = await resp.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(stream);

            var olHits = new List<BookSearchResultDto>();

            if (doc.RootElement.TryGetProperty("docs", out var docs) && docs.ValueKind == JsonValueKind.Array)
            {
                foreach (var d in docs.EnumerateArray().Take(8))
                {
                    var title = d.TryGetProperty("title", out var t) ? t.GetString() : null;
                    if (string.IsNullOrWhiteSpace(title)) continue;

                    // author_name: [ "First Last", ... ]
                    string authorFirst = "Unknown";
                    string authorLast = "Author";

                    if (d.TryGetProperty("author_name", out var a) && a.ValueKind == JsonValueKind.Array)
                    {
                        var full = a.EnumerateArray().FirstOrDefault().GetString();
                        if (!string.IsNullOrWhiteSpace(full))
                        {
                            var parts = full.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                            if (parts.Length == 1)
                            {
                                authorFirst = parts[0];
                                authorLast = "";
                            }
                            else
                            {
                                authorLast = parts[^1];
                                authorFirst = string.Join(' ', parts[..^1]);
                            }
                        }
                    }

                    int? year = null;
                    if (d.TryGetProperty("first_publish_year", out var y) && y.ValueKind == JsonValueKind.Number)
                        year = y.GetInt32();

                    string? isbn = null;
                    if (d.TryGetProperty("isbn", out var isbns))
                        isbn = PickBestIsbn(isbns);

                    olHits.Add(new BookSearchResultDto(
                        null,
                        title!,
                        authorFirst,
                        authorLast,
                        isbn,
                        year,
                        "openlibrary"
                    ));
                }
            }

            // return DB hits first, then OpenLibrary
            return Ok(dbHits.Concat(olHits));
        }
        catch
        {
            // never fail the user just because OpenLibrary is down
            return Ok(dbHits);
        }
    }

    [HttpPost("save-from-catalog")]
    public async Task<IActionResult> SaveFromCatalog([FromBody] SaveFromCatalogDto dto)
    {
        // Normalize incoming text once
        var title = (dto.Title ?? "").Trim();
        var authorFirst = (dto.AuthorFirst ?? "").Trim();
        var authorLast = (dto.AuthorLast ?? "").Trim();

        // Try to find an existing book (prefer ISBN match)
        Book? existing = null;

        var incomingIsbn = string.IsNullOrWhiteSpace(dto.Isbn) ? null : dto.Isbn.Trim();
        var incomingYear = dto.PublishYear;

        if (!string.IsNullOrWhiteSpace(incomingIsbn))
        {
            existing = await _db.Books.FirstOrDefaultAsync(b => b.ISBN == incomingIsbn);
        }

        // Fallback match by Title+Author
        existing ??= await _db.Books.FirstOrDefaultAsync(b =>
            b.Title == title &&
            b.AuthorFirst == authorFirst &&
            b.AuthorLast == authorLast
        );

        if (existing != null)
        {
            return Ok(new BookDto(existing.BId, existing.AuthorFirst, existing.AuthorLast,
                existing.Title, existing.PublishDate, existing.ISBN));
        }

        // If ISBN is missing, attempt to look it up from OpenLibrary by title+author
        if (incomingIsbn == null)
        {
            var authorFull = $"{authorFirst} {authorLast}".Trim();
            try
            {
                var (candidates, year) = await LookupOpenLibraryIsbnsAsync(title, authorFull);
                incomingYear ??= year;

                if (candidates.Count > 0)
                {
                    incomingIsbn = await ChooseIsbnWithCoverAsync(candidates);
                }
            }
            catch
            {
                // best-effort: save still works without ISBN
            }
        }

        DateTime? publishDate = null;
        if (incomingYear.HasValue && incomingYear.Value >= 1000 && incomingYear.Value <= 9999)
        {
            publishDate = new DateTime(incomingYear.Value, 1, 1);
        }

        var book = new Book
        {
            Title = title,
            AuthorFirst = authorFirst,
            AuthorLast = authorLast,
            ISBN = incomingIsbn,
            PublishDate = publishDate
        };

        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        return Ok(new BookDto(book.BId, book.AuthorFirst, book.AuthorLast, book.Title, book.PublishDate, book.ISBN));
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

    [HttpPost("admin/backfill-isbn")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BackfillIsbn([FromQuery] int max = 50)
    {
        // Safety limits
        if (max < 1) max = 1;
        if (max > 500) max = 500;

        // Pull only books missing ISBN (and keep it deterministic)
        var targets = await _db.Books
            .Where(b => b.ISBN == null || b.ISBN.Trim() == "")
            .OrderBy(b => b.BId)
            .Take(max)
            .ToListAsync();

        var checkedCount = targets.Count;
        var updated = 0;
        var skipped = 0;
        var failed = 0;

        foreach (var b in targets)
        {
            try
            {
                var title = (b.Title ?? "").Trim();
                var author = $"{(b.AuthorFirst ?? "").Trim()} {(b.AuthorLast ?? "").Trim()}".Trim();

                if (string.IsNullOrWhiteSpace(title))
                {
                    skipped++;
                    continue;
                }

                var (candidates, year) = await LookupOpenLibraryIsbnsAsync(title, author);

                var chosen = candidates.Count > 0
                    ? await ChooseIsbnWithCoverAsync(candidates)
                    : null;

                if (string.IsNullOrWhiteSpace(chosen))
                {
                    skipped++;
                    continue;
                }

                // Update ISBN
                b.ISBN = chosen;

                // Optionally backfill publish year if missing
                if (!b.PublishDate.HasValue && year.HasValue && year.Value >= 1000 && year.Value <= 9999)
                {
                    b.PublishDate = new DateTime(year.Value, 1, 1);
                }

                updated++;
            }
            catch
            {
                failed++;
            }
        }

        if (updated > 0)
            await _db.SaveChangesAsync();

        return Ok(new
        {
            checkedCount,
            updated,
            skipped,
            failed,
            max
        });
    }

    // -------------------------------
    // OpenLibrary helpers
    // -------------------------------

    private static string? PickBestIsbn(JsonElement isbnArray)
    {
        if (isbnArray.ValueKind != JsonValueKind.Array) return null;

        string? first10 = null;

        foreach (var el in isbnArray.EnumerateArray())
        {
            var s = el.GetString();
            if (string.IsNullOrWhiteSpace(s)) continue;

            s = s.Replace("-", "").Trim();

            // Prefer ISBN-13 digits
            if (s.Length == 13 && s.All(char.IsDigit))
                return s;

            // Keep a fallback ISBN-10
            if (first10 == null && s.Length == 10)
                first10 = s;
        }

        return first10;
    }

    private async Task<bool> HasCoverForIsbnAsync(string isbn)
    {
        // Covers API returns 404 if missing when default=false
        // https://openlibrary.org/dev/docs/api/covers
        var url = $"https://covers.openlibrary.org/b/isbn/{WebUtility.UrlEncode(isbn)}-M.jpg?default=false";

        var client = _http.CreateClient();

        // HEAD is nice but not always supported; fallback to GET headers-only.
        using var head = new HttpRequestMessage(HttpMethod.Head, url);
        using var headResp = await client.SendAsync(head);
        if (headResp.IsSuccessStatusCode) return true;

        using var getResp = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
        return getResp.IsSuccessStatusCode;
    }

    private static List<string> GetIsbnCandidates(JsonElement isbns)
    {
        var list13 = new List<string>();
        var list10 = new List<string>();

        if (isbns.ValueKind != JsonValueKind.Array) return new List<string>();

        foreach (var el in isbns.EnumerateArray())
        {
            var s = el.GetString();
            if (string.IsNullOrWhiteSpace(s)) continue;

            s = s.Replace("-", "").Trim();

            // Prefer digits-only ISBN-13
            if (s.Length == 13 && s.All(char.IsDigit))
                list13.Add(s);
            else if (s.Length == 10)
                list10.Add(s);
        }

        // Prefer isbn13 first
        return list13.Concat(list10).Distinct().ToList();
    }

    private async Task<(List<string> candidates, int? year)> LookupOpenLibraryIsbnsAsync(string title, string author)
    {
        var client = _http.CreateClient();

        // Request the ISBN field explicitly (important)
        var url =
            $"https://openlibrary.org/search.json?title={WebUtility.UrlEncode(title)}" +
            $"&author={WebUtility.UrlEncode(author)}&limit=10" +
            $"&fields=first_publish_year,isbn";

        using var resp = await client.GetAsync(url);
        if (!resp.IsSuccessStatusCode) return (new List<string>(), null);

        await using var stream = await resp.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);

        if (!doc.RootElement.TryGetProperty("docs", out var docs) || docs.ValueKind != JsonValueKind.Array)
            return (new List<string>(), null);

        foreach (var d in docs.EnumerateArray())
        {
            int? year = null;
            if (d.TryGetProperty("first_publish_year", out var y) && y.ValueKind == JsonValueKind.Number)
                year = y.GetInt32();

            if (d.TryGetProperty("isbn", out var isbns))
            {
                var candidates = GetIsbnCandidates(isbns);
                if (candidates.Count > 0)
                    return (candidates, year);
            }
        }

        return (new List<string>(), null);
    }

    private async Task<string?> ChooseIsbnWithCoverAsync(List<string> candidates)
    {
        foreach (var isbn in candidates)
        {
            try
            {
                if (await HasCoverForIsbnAsync(isbn))
                    return isbn;
            }
            catch
            {
                // ignore and continue
            }
        }

        // fallback: if none have a cover, still return the first valid isbn
        return candidates.FirstOrDefault();
    }

    // Keeping this method (unused now) is harmless; remove if you prefer.
    private async Task<(string? isbn, int? year)> LookupOpenLibraryAsync(string title, string author)
    {
        var client = _http.CreateClient();
        var url =
            $"https://openlibrary.org/search.json?title={WebUtility.UrlEncode(title)}&author={WebUtility.UrlEncode(author)}&limit=10";

        using var resp = await client.GetAsync(url);
        if (!resp.IsSuccessStatusCode) return (null, null);

        await using var stream = await resp.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);

        if (!doc.RootElement.TryGetProperty("docs", out var docs) || docs.ValueKind != JsonValueKind.Array)
            return (null, null);

        foreach (var d in docs.EnumerateArray())
        {
            string? isbn = null;
            if (d.TryGetProperty("isbn", out var isbns))
                isbn = PickBestIsbn(isbns);

            int? year = null;
            if (d.TryGetProperty("first_publish_year", out var y) && y.ValueKind == JsonValueKind.Number)
                year = y.GetInt32();

            if (!string.IsNullOrWhiteSpace(isbn))
                return (isbn, year);
        }

        return (null, null);
    }
}