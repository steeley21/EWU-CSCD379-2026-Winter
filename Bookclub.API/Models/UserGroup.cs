using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookClubApp.Models;

public enum UserGroupStatus { Accepted, Pending, Declined }

public class UserGroup
{
    [Key]
    public int UGID { get; set; }

    [Required]
    public string UserID { get; set; } = string.Empty;

    public int GroupID { get; set; }

    public UserGroupStatus Status { get; set; } = UserGroupStatus.Accepted;

    [ForeignKey("UserID")]
    public ApplicationUser User { get; set; } = null!;

    [ForeignKey("GroupID")]
    public Group Group { get; set; } = null!;
}