using BookClubApp.Data;
using BookClubApp.DTOs;
using BookClubApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookClubApp.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly RoleManager<IdentityRole> _roles;
    private readonly ApplicationDbContext _db;

    public AdminController(
        UserManager<ApplicationUser> users,
        RoleManager<IdentityRole> roles,
        ApplicationDbContext db)
    {
        _users = users;
        _roles = roles;
        _db = db;
    }

    // ── Create Admin User (existing) ──────────────────────────────────────────

    [HttpPost("users")]
    public async Task<IActionResult> CreateAdminUser([FromBody] CreateAdminUserDto dto)
    {
        var email = (dto.Email ?? "").Trim();
        var username = (dto.Username ?? "").Trim();
        var fname = (dto.FName ?? "").Trim();
        var lname = (dto.LName ?? "").Trim();

        if (string.IsNullOrWhiteSpace(username)) username = email;

        if (!await _roles.RoleExistsAsync("Admin"))
            await _roles.CreateAsync(new IdentityRole("Admin"));

        var existing = await _users.FindByEmailAsync(email);
        if (existing != null)
        {
            if (!await _users.IsInRoleAsync(existing, "Admin"))
                await _users.AddToRoleAsync(existing, "Admin");

            var roles = await _users.GetRolesAsync(existing);
            return Ok(new AdminUserDto(existing.Id, existing.Email ?? "",
                existing.UserName ?? "", $"{existing.FName} {existing.LName}".Trim(), roles.ToArray()));
        }

        var user = new ApplicationUser
        {
            Email = email,
            UserName = username,
            FName = fname,
            LName = lname,
            EmailConfirmed = true,
        };

        var createRes = await _users.CreateAsync(user, dto.Password);
        if (!createRes.Succeeded)
            return BadRequest(new
            {
                message = "Failed to create admin user.",
                errors = createRes.Errors.Select(e => e.Description).ToArray()
            });

        await _users.AddToRoleAsync(user, "Admin");
        var createdRoles = await _users.GetRolesAsync(user);
        return Created("", new AdminUserDto(user.Id, user.Email ?? "",
            user.UserName ?? "", $"{user.FName} {user.LName}".Trim(), createdRoles.ToArray()));
    }

    // ── List All Users ────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _users.Users
            .OrderBy(u => u.LName).ThenBy(u => u.FName)
            .ToListAsync();

        var result = new List<AdminUserDto>();
        foreach (var u in users)
        {
            var userRoles = await _users.GetRolesAsync(u);
            result.Add(new AdminUserDto(
                u.Id,
                u.Email ?? "",
                u.UserName ?? "",
                $"{u.FName} {u.LName}".Trim(),
                userRoles.ToArray()
            ));
        }

        return Ok(result);
    }

    // ── Delete User ───────────────────────────────────────────────────────────

    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var user = await _users.FindByIdAsync(userId);
        if (user == null) return NotFound(new { message = "User not found." });

        // Remove from all groups
        var userGroups = await _db.UserGroups.Where(ug => ug.UserID == userId).ToListAsync();
        _db.UserGroups.RemoveRange(userGroups);

        // Reassign or delete groups where this user is admin
        var adminGroups = await _db.Groups.Where(g => g.AdminID == userId).ToListAsync();
        _db.Groups.RemoveRange(adminGroups); // simplest: delete the group
        // (alternative: reassign to another member — add that logic here if preferred)

        await _db.SaveChangesAsync();

        var result = await _users.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new
            {
                message = "Failed to delete user.",
                errors = result.Errors.Select(e => e.Description).ToArray()
            });

        return NoContent();
    }

    // ── Promote / Demote Role ─────────────────────────────────────────────────

    [HttpPut("users/{userId}/roles")]
    public async Task<IActionResult> SetRole(string userId, [FromBody] SetRoleDto dto)
    {
        var user = await _users.FindByIdAsync(userId);
        if (user == null) return NotFound(new { message = "User not found." });

        var roleName = (dto.Role ?? "").Trim();
        if (string.IsNullOrWhiteSpace(roleName))
            return BadRequest(new { message = "Role is required." });

        if (!await _roles.RoleExistsAsync(roleName))
            await _roles.CreateAsync(new IdentityRole(roleName));

        if (dto.Grant)
        {
            if (!await _users.IsInRoleAsync(user, roleName))
                await _users.AddToRoleAsync(user, roleName);
        }
        else
        {
            if (await _users.IsInRoleAsync(user, roleName))
                await _users.RemoveFromRoleAsync(user, roleName);
        }

        var updatedRoles = await _users.GetRolesAsync(user);
        return Ok(new AdminUserDto(user.Id, user.Email ?? "", user.UserName ?? "",
            $"{user.FName} {user.LName}".Trim(), updatedRoles.ToArray()));
    }
}