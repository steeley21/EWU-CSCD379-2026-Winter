using BookClubApp.Data;
using BookClubApp.DTOs;
using BookClubApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookClubApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private bool IsSiteAdmin => User.IsInRole("Admin");

    private async Task<Group?> LoadGroupForAccess(int groupId)
    {
        return await _db.Groups
            .Include(g => g.Admin)
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.GroupID == groupId);
    }

    private bool CanAccessGroup(Group g)
    {
        if (IsSiteAdmin) return true;
        if (g.AdminID == CurrentUserId) return true;

        return g.UserGroups.Any(ug =>
            ug.UserID == CurrentUserId &&
            ug.Status == UserGroupStatus.Accepted);
    }

    public GroupsController(ApplicationDbContext db) => _db = db;

    // ── Groups CRUD ───────────────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var groups = await _db.Groups
            .Include(g => g.Admin)
            .Include(g => g.UserGroups)
            .Select(g => new GroupDto(
                g.GroupID,
                g.GroupName,
                g.AdminID,
                g.Admin.FName + " " + g.Admin.LName,
                g.UserGroups.Count(ug => ug.Status == UserGroupStatus.Accepted)))
            .ToListAsync();

        return Ok(groups);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var g = await LoadGroupForAccess(id);
        if (g == null) return NotFound();

        if (!CanAccessGroup(g)) return Forbid();

        return Ok(new GroupDto(
            g.GroupID,
            g.GroupName,
            g.AdminID,
            g.Admin.FName + " " + g.Admin.LName,
            g.UserGroups.Count(ug => ug.Status == UserGroupStatus.Accepted)
        ));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupDto dto)
    {
        // Enforce unique group name (case-insensitive)
        var nameExists = await _db.Groups
            .AnyAsync(g => g.GroupName.ToLower() == dto.GroupName.ToLower().Trim());

        if (nameExists)
            return Conflict(new { message = $"A group named \"{dto.GroupName}\" already exists. Please choose a different name." });

        var group = new Group { GroupName = dto.GroupName.Trim(), AdminID = CurrentUserId };
        _db.Groups.Add(group);
        await _db.SaveChangesAsync();

        // Auto-add creator as member
        _db.UserGroups.Add(new UserGroup { UserID = CurrentUserId, GroupID = group.GroupID });
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = group.GroupID },
            new GroupDto(group.GroupID, group.GroupName, group.AdminID, "", 1));
    }


    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateGroupDto dto)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (group.AdminID != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        group.GroupName = dto.GroupName;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (group.AdminID != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        _db.Groups.Remove(group);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var groups = await _db.UserGroups
            .Where(ug => ug.UserID == CurrentUserId && ug.Status == UserGroupStatus.Accepted)
            .Include(ug => ug.Group)
                .ThenInclude(g => g.Admin)
            .Include(ug => ug.Group)
                .ThenInclude(g => g.UserGroups)
            .Select(ug => new GroupDto(
                ug.Group.GroupID,
                ug.Group.GroupName,
                ug.Group.AdminID,
                ug.Group.Admin.FName + " " + ug.Group.Admin.LName,
                ug.Group.UserGroups.Count(m => m.Status == UserGroupStatus.Accepted)
            ))
            .ToListAsync();

        return Ok(groups);
    }

    // ── Members ───────────────────────────────────────────────────────────────

    [HttpGet("{id}/members")]
    public async Task<IActionResult> GetMembers(int id)
    {
        var g = await LoadGroupForAccess(id);
        if (g == null) return NotFound();

        if (!CanAccessGroup(g)) return Forbid();

        var members = await _db.UserGroups
            .Where(ug => ug.GroupID == id && ug.Status == UserGroupStatus.Accepted)
            .Include(ug => ug.User)
            .Select(ug => new UserGroupDto(
                ug.UGID,
                ug.UserID,
                ug.User.FName + " " + ug.User.LName,
                ug.User.UserName!
            ))
            .ToListAsync();

        return Ok(members);
    }

    [HttpPost("{id}/members/{userId}")]
    public async Task<IActionResult> AddMember(int id, string userId)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (group.AdminID != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        var exists = await _db.UserGroups.AnyAsync(ug => ug.GroupID == id && ug.UserID == userId);
        if (exists) return Conflict("User already in group.");

        _db.UserGroups.Add(new UserGroup { UserID = userId, GroupID = id });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(int id, string userId)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (group.AdminID != CurrentUserId && userId != CurrentUserId && !User.IsInRole("Admin"))
            return Forbid();

        var ug = await _db.UserGroups.FirstOrDefaultAsync(ug => ug.GroupID == id && ug.UserID == userId);
        if (ug == null) return NotFound();

        _db.UserGroups.Remove(ug);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Group Books ───────────────────────────────────────────────────────────

    [HttpGet("{id}/books")]
    public async Task<IActionResult> GetBooks(int id)
    {
        // Membership check (Accepted members) OR group admin OR site Admin
        var group = await _db.Groups.AsNoTracking().FirstOrDefaultAsync(g => g.GroupID == id);
        if (group == null) return NotFound();

        var isSiteAdmin = User.IsInRole("Admin");
        var isGroupAdmin = group.AdminID == CurrentUserId;

        var isMember = isSiteAdmin || isGroupAdmin || await _db.UserGroups.AnyAsync(ug =>
            ug.GroupID == id &&
            ug.UserID == CurrentUserId &&
            ug.Status == UserGroupStatus.Accepted);

        if (!isMember) return Forbid();

        var books = await _db.GroupBooks
            .Where(gb => gb.GroupID == id)
            .Include(gb => gb.Book)
            .Select(gb => new GroupBookDto(
                gb.GBID,
                gb.GroupID,
                new BookDto(
                    gb.Book.BId,
                    gb.Book.AuthorFirst,
                    gb.Book.AuthorLast,
                    gb.Book.Title,
                    gb.Book.PublishDate,
                    gb.Book.ISBN
                ),
                // AvgRating (null if no reviews)
                gb.Reviews.Select(r => (decimal?)r.Rating).Average(),
                // ReviewCount
                gb.Reviews.Count()
            ))
            .ToListAsync();

        return Ok(books);
    }

    [HttpPost("{id}/books/{bookId}")]
    public async Task<IActionResult> AddBook(int id, int bookId)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound("Group not found.");
        if (group.AdminID != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        var bookExists = await _db.Books.AnyAsync(b => b.BId == bookId);
        if (!bookExists) return NotFound("Book not found.");

        var already = await _db.GroupBooks.AnyAsync(gb => gb.GroupID == id && gb.BId == bookId);
        if (already) return Conflict("Book already in group.");

        _db.GroupBooks.Add(new GroupBook { GroupID = id, BId = bookId });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}/books/{gbId}")]
    public async Task<IActionResult> RemoveBook(int id, int gbId)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (group.AdminID != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        var gb = await _db.GroupBooks.FirstOrDefaultAsync(gb => gb.GBID == gbId && gb.GroupID == id);
        if (gb == null) return NotFound();

        _db.GroupBooks.Remove(gb);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Schedule ──────────────────────────────────────────────────────────────

    [HttpGet("{id}/schedule")]
    public async Task<IActionResult> GetSchedule(int id)
    {
        var g = await LoadGroupForAccess(id);
        if (g == null) return NotFound();

        if (!CanAccessGroup(g)) return Forbid();

        var schedule = await _db.GroupSchedules
            .Where(gs => gs.GroupID == id)
            .Include(gs => gs.Book)
            .OrderBy(gs => gs.DateTime)
            .Select(gs => new GroupScheduleDto(
                gs.GSID,
                gs.GroupID,
                new BookDto(
                    gs.Book.BId,
                    gs.Book.AuthorFirst,
                    gs.Book.AuthorLast,
                    gs.Book.Title,
                    gs.Book.PublishDate,
                    gs.Book.ISBN
                ),
                gs.DateTime,
                gs.Duration,
                gs.Location
            ))
            .ToListAsync();

        return Ok(schedule);
    }

    [HttpPost("{id}/schedule")]
    public async Task<IActionResult> AddSchedule(int id, [FromBody] CreateGroupScheduleDto dto)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (group.AdminID != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        var gs = new GroupSchedule
        {
            GroupID = id,
            BId = dto.BId,
            DateTime = dto.DateTime,
            Duration = dto.Duration,
            Location = dto.Location
        };
        _db.GroupSchedules.Add(gs);
        await _db.SaveChangesAsync();
        return Ok(new { gs.GSID });
    }

    [HttpDelete("{id}/schedule/{gsId}")]
    public async Task<IActionResult> DeleteSchedule(int id, int gsId)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (group.AdminID != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        var gs = await _db.GroupSchedules.FirstOrDefaultAsync(gs => gs.GSID == gsId && gs.GroupID == id);
        if (gs == null) return NotFound();

        _db.GroupSchedules.Remove(gs);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Invites ───────────────────────────────────────────────────────────────────

    [HttpPost("{id}/invite")]
    public async Task<IActionResult> InviteMember(int id, [FromBody] InviteMemberDto dto)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound("Group not found.");
        if (group.AdminID != CurrentUserId && !User.IsInRole("Admin")) return Forbid();

        // Look up user by email
        var invitee = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (invitee == null)
            return NotFound(new { message = $"No account found for {dto.Email}." });

        // Check if already a member or already invited
        var existing = await _db.UserGroups
            .FirstOrDefaultAsync(ug => ug.GroupID == id && ug.UserID == invitee.Id);

        if (existing != null)
        {
            if (existing.Status == UserGroupStatus.Accepted)
                return Conflict(new { message = "User is already a member of this group." });
            if (existing.Status == UserGroupStatus.Pending)
                return Conflict(new { message = "User has already been invited." });

            // Re-invite if they previously declined
            existing.Status = UserGroupStatus.Pending;
            await _db.SaveChangesAsync();
            return Ok();
        }

        _db.UserGroups.Add(new UserGroup
        {
            UserID = invitee.Id,
            GroupID = id,
            Status = UserGroupStatus.Pending
        });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("my-invites")]
    public async Task<IActionResult> GetMyInvites()
    {
        var invites = await _db.UserGroups
            .Where(ug => ug.UserID == CurrentUserId && ug.Status == UserGroupStatus.Pending)
            .Include(ug => ug.Group)
                .ThenInclude(g => g.Admin)
            .Include(ug => ug.Group)
                .ThenInclude(g => g.UserGroups)
            .Select(ug => new GroupInviteDto(
                ug.UGID,
                ug.GroupID,
                ug.Group.GroupName,
                ug.Group.Admin.FName + " " + ug.Group.Admin.LName,
                ug.Group.UserGroups.Count(m => m.Status == UserGroupStatus.Accepted)
            ))
            .ToListAsync();

        return Ok(invites);
    }

    [HttpPost("invites/{ugId}/accept")]
    public async Task<IActionResult> AcceptInvite(int ugId)
    {
        var ug = await _db.UserGroups.FindAsync(ugId);
        if (ug == null || ug.UserID != CurrentUserId) return NotFound();
        if (ug.Status != UserGroupStatus.Pending) return BadRequest("Invite is no longer pending.");

        ug.Status = UserGroupStatus.Accepted;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("invites/{ugId}/decline")]
    public async Task<IActionResult> DeclineInvite(int ugId)
    {
        var ug = await _db.UserGroups.FindAsync(ugId);
        if (ug == null || ug.UserID != CurrentUserId) return NotFound();
        if (ug.Status != UserGroupStatus.Pending) return BadRequest("Invite is no longer pending.");

        ug.Status = UserGroupStatus.Declined;
        await _db.SaveChangesAsync();
        return Ok();
    }
}
