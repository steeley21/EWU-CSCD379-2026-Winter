using System.ComponentModel.DataAnnotations;

namespace BookClubApp.DTOs;

// ── Book ──────────────────────────────────────────────────────────────────────
public record BookDto(int BId, string AuthorFirst, string AuthorLast, string Title, DateTime? PublishDate, string? ISBN);

public record CreateBookDto(
    [Required] string AuthorFirst,
    [Required] string AuthorLast,
    [Required] string Title,
    DateTime? PublishDate,
    string? ISBN
);

// ── Group ─────────────────────────────────────────────────────────────────────
public record GroupDto(int GroupID, string GroupName, string AdminID, string AdminFullName, int MemberCount);

public record CreateGroupDto([Required] string GroupName);

public record UpdateGroupDto([Required] string GroupName);

// ── GroupBook ─────────────────────────────────────────────────────────────────
public record GroupBookDto(int GBID, int GroupID, BookDto Book, decimal? AvgRating, int ReviewCount);

// ── UserGroup ─────────────────────────────────────────────────────────────────
public record UserGroupDto(int UGID, string UserID, string FullName, string Username);

// ── GroupSchedule ─────────────────────────────────────────────────────────────
public record GroupScheduleDto(int GSID, int GroupID, BookDto Book, DateTime DateTime, int Duration, string? Location);

// ── Invites ───────────────────────────────────────────────────────────────────
public record InviteMemberDto([Required][EmailAddress] string Email);

public record GroupInviteDto(int UGID, int GroupID, string GroupName, string AdminFullName, int MemberCount);

public record CreateGroupScheduleDto(
    [Required] int BId,
    [Required] DateTime DateTime,
    [Range(1, 1440)] int Duration,
    string? Location
);

// ── Book Search Result ─────────────────────────────────────────────────────────
public record BookSearchResultDto(
    int? Id,               // null when from OpenLibrary
    string Title,
    string AuthorFirst,
    string AuthorLast,
    string? Isbn,
    int? PublishYear,
    string Source          // "db" | "openlibrary"
);

public record SaveFromCatalogDto(
    [Required] string Title,
    [Required] string AuthorFirst,
    [Required] string AuthorLast,
    string? Isbn,
    int? PublishYear
);

// ── Backfill ISBN Result ─────────────────────────────────────────────────────
public record BackfillIsbnResultDto(
    int Checked,
    int Updated,
    int Skipped,
    int Failed
);

// ── GroupBookReview ───────────────────────────────────────────────────────────
public record GroupBookReviewDto(
    int ReviewId,
    int GBID,
    string UserID,
    string FullName,
    decimal Rating,
    string? Comment,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record UpsertGroupBookReviewDto(decimal Rating, string? Comment);