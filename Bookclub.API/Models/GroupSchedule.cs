using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookClubApp.Models;

public class GroupSchedule
{
    [Key]
    public int GSID { get; set; }

    public int GroupID { get; set; }

    public int BId { get; set; }

    [Required]
    public DateTime DateTime { get; set; }

    public int Duration { get; set; } // in minutes

    [MaxLength(300)]
    public string? Location { get; set; }

    [ForeignKey("GroupID")]
    public Group Group { get; set; } = null!;

    [ForeignKey("BId")]
    public Book Book { get; set; } = null!;
}
