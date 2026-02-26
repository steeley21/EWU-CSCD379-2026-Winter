using System.ComponentModel.DataAnnotations;

namespace BookClubApp.Models;

public class Book
{
    [Key]
    public int BId { get; set; }

    [Required, MaxLength(100)]
    public string AuthorFirst { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string AuthorLast { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public DateTime? PublishDate { get; set; }

    [MaxLength(20)]
    public string? ISBN { get; set; }

    // Navigation
    public ICollection<GroupBook> GroupBooks { get; set; } = new List<GroupBook>();
    public ICollection<GroupSchedule> GroupSchedules { get; set; } = new List<GroupSchedule>();
    public ICollection<UserBook> UserBooks { get; set; } = new List<UserBook>();
}
