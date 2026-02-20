using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookClubApp.Models;

public class UserGroup
{
    [Key]
    public int UGID { get; set; }

    [Required]
    public string UserID { get; set; } = string.Empty;
    
    public int GroupID { get; set; }

    [ForeignKey("UserID")]
    public ApplicationUser User { get; set; } = null!;

    [ForeignKey("GroupID")]
    public Group Group { get; set; } = null!;
}
