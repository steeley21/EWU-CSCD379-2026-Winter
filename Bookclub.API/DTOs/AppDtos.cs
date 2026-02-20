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
public record GroupBookDto(int GBID, int GroupID, BookDto Book);

// ── UserGroup ─────────────────────────────────────────────────────────────────
public record UserGroupDto(int UGID, string UserID, string FullName, string Username);

// ── GroupSchedule ─────────────────────────────────────────────────────────────
public record GroupScheduleDto(int GSID, int GroupID, BookDto Book, DateTime DateTime, int Duration, string? Location);

public record CreateGroupScheduleDto(
    [Required] int BId,
    [Required] DateTime DateTime,
    [Range(1, 1440)] int Duration,
    string? Location
);
