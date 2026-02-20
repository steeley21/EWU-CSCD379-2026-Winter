using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace BookClubApp.Models;

public class ApplicationUser : IdentityUser
{
    [Key]
    public string UserID { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LName { get; set; } = string.Empty;

    // Navigation
    public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();
    public ICollection<Group> AdminGroups { get; set; } = new List<Group>();
}
