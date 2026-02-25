using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace BookClubApp.Models;

public class GroupBook
{
    [Key]
    public int GBID { get; set; }

    public int GroupID { get; set; }
    public int BId { get; set; }

    [ForeignKey("GroupID")]
    public Group Group { get; set; } = null!;

    [ForeignKey("BId")]
    public Book Book { get; set; } = null!;

    public ICollection<GroupBookReview> Reviews { get; set; } = new List<GroupBookReview>();
}
