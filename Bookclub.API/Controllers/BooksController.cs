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

    // ─────────────────────────────────────────────────────────────
    // PUBLIC: Books + aggregated ratings across ALL group reviews
    // (dedupe to latest review per user per book)
    // ─────────────────────────────────────────────────────────────

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicAll()
    {
        // 1) Load books (base list)
        var books = await _db.Books.AsNoTracking()
            .Select(b => new
            {
                b.BId,
                b.AuthorFirst,
                b.AuthorLast,
                b.Title,
                b.PublishDate,
                b.ISBN
            })
            .ToListAsync();

        // 2) Flatten reviews -> (ReviewId, BId, UserID, Rating, Stamp)
        // NOTE: EF.Property<T?> prevents "Nullable object must have a value" if legacy rows contain NULLs.
        var baseReviews =
            from r in _db.GroupBookReviews.AsNoTracking()
            join gb in _db.GroupBooks.AsNoTracking() on r.GBID equals gb.GBID
            let updated = EF.Property<DateTime?>(r, nameof(GroupBookReview.UpdatedAt))
            let created = EF.Property<DateTime?>(r, nameof(GroupBookReview.CreatedAt))
            let stamp = updated ?? created ?? new DateTime(2000, 1, 1)
            let rating = EF.Property<decimal?>(r, nameof(GroupBookReview.Rating))
            select new
            {
                r.ReviewId,
                gb.BId,
                r.UserID,
                Rating = rating ?? 0m,
                Stamp = stamp
            };

        // 3) max Stamp per (BId, UserID)
        var maxStamp =
            from x in baseReviews
            group x by new { x.BId, x.UserID } into g
            select new
            {
                g.Key.BId,
                g.Key.UserID,
                MaxStamp = g.Max(v => v.Stamp)
            };

        // 4) candidates matching max Stamp
        var candidates =
            from x in baseReviews
            join ms in maxStamp
                on new { x.BId, x.UserID, Stamp = x.Stamp }
                equals new { ms.BId, ms.UserID, Stamp = ms.MaxStamp }
            select x;

        // 5) tie-break by max ReviewId
        var latestIds =
            from c in candidates
            group c by new { c.BId, c.UserID } into g
            select g.Max(v => v.ReviewId);

        // 6) latest deduped set (one per user per book)
        var latestPerUserBook =
            from x in baseReviews
            join id in latestIds on x.ReviewId equals id
            select x;

        // 7) Aggregate per book
        var ratingByBook = await latestPerUserBook
            .GroupBy(x => x.BId)
            .Select(g => new
            {
                BId = g.Key,
                ReviewCount = g.Count(),
                AvgRating = g.Average(v => v.Rating)
            })
            .ToListAsync();

        var ratingMap = ratingByBook.ToDictionary(x => x.BId, x => x);

        // 8) Merge in memory
        var result = books.Select(b =>
        {
            if (ratingMap.TryGetValue(b.BId, out var r))
            {
                return new PublicBookDto(
                    b.BId,
                    b.AuthorFirst,
                    b.AuthorLast,
                    b.Title,
                    b.PublishDate,
                    b.ISBN,
                    (decimal?)r.AvgRating,
                    r.ReviewCount
                );
            }

            return new PublicBookDto(
                b.BId,
                b.AuthorFirst,
                b.AuthorLast,
                b.Title,
                b.PublishDate,
                b.ISBN,
                null,
                0
            );
        }).ToList();

        return Ok(result);
    }

    [HttpGet("public/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicById(int id)
    {
        var b = await _db.Books.AsNoTracking().FirstOrDefaultAsync(x => x.BId == id);
        if (b == null) return NotFound();

        var baseReviews =
            from r in _db.GroupBookReviews.AsNoTracking()
            join gb in _db.GroupBooks.AsNoTracking() on r.GBID equals gb.GBID
            where gb.BId == id
            select new
            {
                r.ReviewId,
                gb.BId,
                r.UserID,
                r.Rating,
                r.UpdatedAt
            };

        var maxUpdated =
            from x in baseReviews
            group x by new { x.BId, x.UserID } into g
            select new
            {
                g.Key.BId,
                g.Key.UserID,
                MaxUpdatedAt = g.Max(v => v.UpdatedAt)
            };

        var candidates =
            from x in baseReviews
            join mu in maxUpdated
                on new { x.BId, x.UserID, UpdatedAt = x.UpdatedAt }
                equals new { mu.BId, mu.UserID, UpdatedAt = mu.MaxUpdatedAt }
            select x;

        var latestIds =
            from c in candidates
            group c by new { c.BId, c.UserID } into g
            select g.Max(v => v.ReviewId);

        var latestPerUserBook =
            from x in baseReviews
            join id2 in latestIds on x.ReviewId equals id2
            select x;

        var rating = await latestPerUserBook
            .GroupBy(x => x.BId)
            .Select(g => new
            {
                ReviewCount = (int?)g.Count(),
                AvgRating = (decimal?)g.Average(v => v.Rating)
            })
            .FirstOrDefaultAsync();

        return Ok(new PublicBookDto(
            b.BId,
            b.AuthorFirst,
            b.AuthorLast,
            b.Title,
            b.PublishDate,
            b.ISBN,
            rating?.AvgRating,
            rating?.ReviewCount ?? 0
        ));
    }

    [HttpGet("featured")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFeatured([FromQuery] int limit = 6)
    {
        if (limit < 1) limit = 1;
        if (limit > 20) limit = 20;

        var featuredBooks = await _db.Books
            .OrderByDescending(b => b.BId)
            .Take(limit)
            .Select(b => new
            {
                b.BId,
                b.AuthorFirst,
                b.AuthorLast,
                b.Title,
                b.PublishDate,
                b.ISBN
            })
            .ToListAsync();

        var featuredIds = featuredBooks.Select(b => b.BId).ToList();

        var baseReviews =
            from r in _db.GroupBookReviews.AsNoTracking()
            join gb in _db.GroupBooks.AsNoTracking() on r.GBID equals gb.GBID
            where featuredIds.Contains(gb.BId)
            select new
            {
                r.ReviewId,
                BId = gb.BId,
                r.UserID,
                r.Rating,
                r.Comment,
                r.UpdatedAt,
                UserFName = r.User.FName
            };

        var maxUpdated =
            from x in baseReviews
            group x by new { x.BId, x.UserID } into g
            select new
            {
                g.Key.BId,
                g.Key.UserID,
                MaxUpdatedAt = g.Max(v => v.UpdatedAt)
            };

        var candidates =
            from x in baseReviews
            join mu in maxUpdated
                on new { x.BId, x.UserID, UpdatedAt = x.UpdatedAt }
                equals new { mu.BId, mu.UserID, UpdatedAt = mu.MaxUpdatedAt }
            select x;

        var latestIds =
            from c in candidates
            group c by new { c.BId, c.UserID } into g
            select g.Max(v => v.ReviewId);

        var latestPerUserBook =
            from x in baseReviews
            join id in latestIds on x.ReviewId equals id
            select x;

        var ratingByBook = await latestPerUserBook
            .GroupBy(x => x.BId)
            .Select(g => new
            {
                BId = g.Key,
                ReviewCount = g.Count(),
                AvgRating = g.Average(v => v.Rating)
            })
            .ToListAsync();

        var commentBase = latestPerUserBook.Where(x => x.Comment != null && x.Comment != "");

        var maxCommentUpdated =
            from x in commentBase
            group x by x.BId into g
            select new
            {
                BId = g.Key,
                MaxUpdatedAt = g.Max(v => v.UpdatedAt)
            };

        var commentCandidates =
            from x in commentBase
            join mu in maxCommentUpdated
                on new { x.BId, UpdatedAt = x.UpdatedAt }
                equals new { mu.BId, UpdatedAt = mu.MaxUpdatedAt }
            select x;

        var latestCommentIds =
            from c in commentCandidates
            group c by c.BId into g
            select g.Max(v => v.ReviewId);

        var latestComments = await (
            from x in commentCandidates
            join id in latestCommentIds on x.ReviewId equals id
            select new { x.BId, x.Comment, x.UserFName }
        ).ToListAsync();

        var ratingMap = ratingByBook.ToDictionary(x => x.BId, x => x);
        var commentMap = latestComments.ToDictionary(x => x.BId, x => x);

        static string FirstNameOrAnonymous(string? fname)
        {
            var s = (fname ?? "").Trim();
            if (string.IsNullOrWhiteSpace(s)) return "Anonymous";
            var first = s.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
            return string.IsNullOrWhiteSpace(first) ? "Anonymous" : first;
        }

        static string? Truncate(string? c, int max = 140)
        {
            if (string.IsNullOrWhiteSpace(c)) return null;
            var s = c.Trim();
            return s.Length <= max ? s : s.Substring(0, max).Trim() + "…";
        }

        var result = featuredBooks.Select(b =>
        {
            ratingMap.TryGetValue(b.BId, out var r);
            commentMap.TryGetValue(b.BId, out var c);

            return new FeaturedBookDto(
                b.BId,
                b.AuthorFirst,
                b.AuthorLast,
                b.Title,
                b.PublishDate,
                b.ISBN,
                r == null ? (decimal?)null : r.AvgRating,
                r == null ? 0 : r.ReviewCount,
                Truncate(c?.Comment),
                c == null ? null : FirstNameOrAnonymous(c.UserFName)
            );
        }).ToList();

        return Ok(result);
    }

    // ─────────────────────────────────────────────────────────────
    // Existing endpoints below (unchanged)
    // ─────────────────────────────────────────────────────────────

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        q = (q ?? "").Trim();
        if (q.Length < 2)
            return Ok(Array.Empty<BookSearchResultDto>());

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

        var client = _http.CreateClient();
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

            return Ok(dbHits.Concat(olHits));
        }
        catch
        {
            return Ok(dbHits);
        }
    }

    [HttpPost("save-from-catalog")]
    public async Task<IActionResult> SaveFromCatalog([FromBody] SaveFromCatalogDto dto)
    {
        var title = (dto.Title ?? "").Trim();
        var authorFirst = (dto.AuthorFirst ?? "").Trim();
        var authorLast = (dto.AuthorLast ?? "").Trim();

        Book? existing = null;

        var incomingIsbn = string.IsNullOrWhiteSpace(dto.Isbn) ? null : dto.Isbn.Trim();
        var incomingYear = dto.PublishYear;

        if (!string.IsNullOrWhiteSpace(incomingIsbn))
            existing = await _db.Books.FirstOrDefaultAsync(b => b.ISBN == incomingIsbn);

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

        if (incomingIsbn == null)
        {
            var authorFull = $"{authorFirst} {authorLast}".Trim();
            try
            {
                var (candidates, year) = await LookupOpenLibraryIsbnsAsync(title, authorFull);
                incomingYear ??= year;

                if (candidates.Count > 0)
                    incomingIsbn = await ChooseIsbnWithCoverAsync(candidates);
            }
            catch { }
        }

        DateTime? publishDate = null;
        if (incomingYear.HasValue && incomingYear.Value >= 1000 && incomingYear.Value <= 9999)
            publishDate = new DateTime(incomingYear.Value, 1, 1);

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
    [AllowAnonymous]
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

            if (s.Length == 13 && s.All(char.IsDigit))
                return s;

            if (first10 == null && s.Length == 10)
                first10 = s;
        }

        return first10;
    }

    private async Task<bool> HasCoverForIsbnAsync(string isbn)
    {
        var url = $"https://covers.openlibrary.org/b/isbn/{WebUtility.UrlEncode(isbn)}-M.jpg?default=false";
        var client = _http.CreateClient();

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

            if (s.Length == 13 && s.All(char.IsDigit))
                list13.Add(s);
            else if (s.Length == 10)
                list10.Add(s);
        }

        return list13.Concat(list10).Distinct().ToList();
    }

    private async Task<(List<string> candidates, int? year)> LookupOpenLibraryIsbnsAsync(string title, string author)
    {
        var client = _http.CreateClient();

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
            catch { }
        }

        return candidates.FirstOrDefault();
    }
}