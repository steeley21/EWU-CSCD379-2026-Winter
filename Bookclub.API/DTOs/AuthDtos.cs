using System.ComponentModel.DataAnnotations;

namespace BookClubApp.DTOs;

public record RegisterDto(
    [Required] string FName,
    [Required] string LName,
    [Required, EmailAddress] string Email,
    [Required] string Username,
    [Required, MinLength(8)] string Password
);

public record LoginDto(
    [Required] string Email,
    [Required] string Password
);

public record AuthResponseDto(
    string Token,
    string UserId,
    string Email,
    string Username,
    IList<string> Roles
);

public record CreateAdminUserDto(
    [Required, EmailAddress] string Email,
    [Required] string Username,
    [Required] string FName,
    [Required] string LName,
    [Required] string Password
);

public record AdminUserDto(
    string UserId,
    string Email,
    string Username,
    string FullName,
    string[] Roles
);
