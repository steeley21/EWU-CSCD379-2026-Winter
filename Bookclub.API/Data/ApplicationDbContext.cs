using BookClubApp.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BookClubApp.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Book> Books => Set<Book>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupBook> GroupBooks => Set<GroupBook>();
    public DbSet<UserGroup> UserGroups => Set<UserGroup>();
    public DbSet<GroupSchedule> GroupSchedules => Set<GroupSchedule>();
    public DbSet<ForumPost> ForumPosts => Set<ForumPost>();
    public DbSet<ForumReply> ForumReplies => Set<ForumReply>();

    public DbSet<GroupBookReview> GroupBookReviews => Set<GroupBookReview>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // GroupBook unique constraint (a book shouldn't be added twice to same group)
        builder.Entity<GroupBook>()
            .HasIndex(gb => new { gb.GroupID, gb.BId })
            .IsUnique();

        // UserGroup unique constraint (user can only be in a group once)
        builder.Entity<UserGroup>()
            .HasIndex(ug => new { ug.UserID, ug.GroupID })
            .IsUnique();

        // Group -> Admin (restrict delete so admin can't be deleted while owning groups)
        builder.Entity<Group>()
            .HasOne(g => g.Admin)
            .WithMany(u => u.AdminGroups)
            .HasForeignKey(g => g.AdminID)
            .OnDelete(DeleteBehavior.Restrict);

        // UserGroup -> User
        builder.Entity<UserGroup>()
            .HasOne(ug => ug.User)
            .WithMany(u => u.UserGroups)
            .HasForeignKey(ug => ug.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        // UserGroup -> Group
        builder.Entity<UserGroup>()
            .HasOne(ug => ug.Group)
            .WithMany(g => g.UserGroups)
            .HasForeignKey(ug => ug.GroupID)
            .OnDelete(DeleteBehavior.Cascade);

        // GroupBookReview: 1 review per user per GroupBook
        builder.Entity<GroupBookReview>()
            .HasIndex(r => new { r.GBID, r.UserID })
            .IsUnique();

        // decimal precision: “any decimal” but store to 2dp 
        builder.Entity<GroupBookReview>()
            .Property(r => r.Rating)
            .HasPrecision(4, 2);

        builder.Entity<GroupBookReview>()
            .Property(r => r.Comment)
            .HasMaxLength(2000);

        builder.Entity<GroupBookReview>()
            .HasOne(r => r.GroupBook)
            .WithMany(gb => gb.Reviews)
            .HasForeignKey(r => r.GBID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<GroupBookReview>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserID)
            .OnDelete(DeleteBehavior.Cascade);
        // ForumPost -> Group
        builder.Entity<ForumPost>()
            .HasOne(p => p.Group)
            .WithMany()
            .HasForeignKey(p => p.GroupID)
            .OnDelete(DeleteBehavior.Cascade);

        // ForumPost -> User
        builder.Entity<ForumPost>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserID)
            .OnDelete(DeleteBehavior.NoAction);

        // ForumReply -> ForumPost
        builder.Entity<ForumReply>()
            .HasOne(r => r.Post)
            .WithMany(p => p.Replies)
            .HasForeignKey(r => r.PostID)
            .OnDelete(DeleteBehavior.Cascade);

        // ForumReply -> User
        builder.Entity<ForumReply>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserID)
            .OnDelete(DeleteBehavior.NoAction);
    }
}