using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookClubApp.Models;

public class Group
{
    [Key]
    public int GroupID { get; set; }

    [Required, MaxLength(150)]
    public string GroupName { get; set; } = string.Empty;

    [Required]
    public string AdminID { get; set; } = string.Empty; // FK to ApplicationUser

    // Navigation
    [ForeignKey("AdminID")]
    public ApplicationUser Admin { get; set; } = null!;

    public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();
    public ICollection<GroupBook> GroupBooks { get; set; } = new List<GroupBook>();
    public ICollection<GroupSchedule> GroupSchedules { get; set; } = new List<GroupSchedule>();
}
