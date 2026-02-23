using BookClubApp.DTOs;
using BookClubApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BookClubApp.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly RoleManager<IdentityRole> _roles;

    public AdminController(UserManager<ApplicationUser> users, RoleManager<IdentityRole> roles)
    {
        _users = users;
        _roles = roles;
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateAdminUser([FromBody] CreateAdminUserDto dto)
    {
        // normalize
        var email = (dto.Email ?? "").Trim();
        var username = (dto.Username ?? "").Trim();
        var fname = (dto.FName ?? "").Trim();
        var lname = (dto.LName ?? "").Trim();

        if (string.IsNullOrWhiteSpace(username))
            username = email;

        // ensure Admin role exists
        if (!await _roles.RoleExistsAsync("Admin"))
            await _roles.CreateAsync(new IdentityRole("Admin"));

        // if user exists, just ensure Admin role
        var existing = await _users.FindByEmailAsync(email);
        if (existing != null)
        {
            if (!await _users.IsInRoleAsync(existing, "Admin"))
                await _users.AddToRoleAsync(existing, "Admin");

            var roles = await _users.GetRolesAsync(existing);
            return Ok(new AdminUserDto(
                existing.Id,
                existing.Email ?? "",
                existing.UserName ?? "",
                $"{existing.FName} {existing.LName}".Trim(),
                roles.ToArray()
            ));
        }

        // create new user
        var user = new ApplicationUser
        {
            Email = email,
            UserName = username,
            FName = fname,
            LName = lname,
            EmailConfirmed = true, // makes testing easier; remove if you want confirmation later
        };

        var createRes = await _users.CreateAsync(user, dto.Password);
        if (!createRes.Succeeded)
        {
            return BadRequest(new
            {
                message = "Failed to create admin user.",
                errors = createRes.Errors.Select(e => e.Description).ToArray()
            });
        }

        await _users.AddToRoleAsync(user, "Admin");

        var createdRoles = await _users.GetRolesAsync(user);
        return Created("", new AdminUserDto(
            user.Id,
            user.Email ?? "",
            user.UserName ?? "",
            $"{user.FName} {user.LName}".Trim(),
            createdRoles.ToArray()
        ));
    }
}