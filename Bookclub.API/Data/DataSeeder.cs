using BookClubApp.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BookClubApp.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // ── Roles ─────────────────────────────────────────────────────────────
        foreach (var role in new[] { "Admin", "GroupAdmin", "Member" })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // ── Users ─────────────────────────────────────────────────────────────
        async Task<ApplicationUser?> CreateUser(string firstName, string lastName, string email, string username, string password, string role)
        {
            if (await userManager.FindByEmailAsync(email) != null) return null;

            var user = new ApplicationUser
            {
                FName = firstName,
                LName = lastName,
                Email = email,
                UserName = username,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(user, role);

            return result.Succeeded ? user : null;
        }

        var alice = await CreateUser("Alice", "Johnson", "alice@example.com", "alicej", "Password1!", "Admin");
        var bob = await CreateUser("Bob", "Smith", "bob@example.com", "bobs", "Password1!", "GroupAdmin");
        var carol = await CreateUser("Carol", "White", "carol@example.com", "carolw", "Password1!", "Member");
        var dave = await CreateUser("Dave", "Brown", "dave@example.com", "daveb", "Password1!", "Member");

        // Fetch existing users if they were already seeded
        alice ??= await userManager.FindByEmailAsync("alice@example.com");
        bob ??= await userManager.FindByEmailAsync("bob@example.com");
        carol ??= await userManager.FindByEmailAsync("carol@example.com");
        dave ??= await userManager.FindByEmailAsync("dave@example.com");

        // ── Books ─────────────────────────────────────────────────────────────
        if (!await db.Books.AnyAsync())
        {
            db.Books.AddRange(
                new Book { AuthorFirst = "F. Scott", AuthorLast = "Fitzgerald", Title = "The Great Gatsby", PublishDate = new DateTime(1925, 4, 10), ISBN = "9780743273565" },
                new Book { AuthorFirst = "Harper", AuthorLast = "Lee", Title = "To Kill a Mockingbird", PublishDate = new DateTime(1960, 7, 11), ISBN = "9780061935466" },
                new Book { AuthorFirst = "George", AuthorLast = "Orwell", Title = "1984", PublishDate = new DateTime(1949, 6, 8), ISBN = "9780451524935" },
                new Book { AuthorFirst = "Jane", AuthorLast = "Austen", Title = "Pride and Prejudice", PublishDate = new DateTime(1813, 1, 28), ISBN = "9780141439518" },
                new Book { AuthorFirst = "J.R.R.", AuthorLast = "Tolkien", Title = "The Fellowship of the Ring", PublishDate = new DateTime(1954, 7, 29), ISBN = "9780618574940" },
                new Book { AuthorFirst = "Toni", AuthorLast = "Morrison", Title = "Beloved", PublishDate = new DateTime(1987, 9, 2), ISBN = "9781400033416" },
                new Book { AuthorFirst = "Gabriel", AuthorLast = "García Márquez", Title = "One Hundred Years of Solitude", PublishDate = new DateTime(1967, 5, 30), ISBN = "9780060883287" },
                new Book { AuthorFirst = "Fyodor", AuthorLast = "Dostoevsky", Title = "Crime and Punishment", PublishDate = new DateTime(1866, 1, 1), ISBN = "9780486415871" }
            );
            await db.SaveChangesAsync();
        }

        // ── Groups ────────────────────────────────────────────────────────────
        if (!await db.Groups.AnyAsync() && bob != null && alice != null)
        {
            db.Groups.AddRange(
                new Group { GroupName = "Classic Lit Club", AdminID = bob.Id },
                new Group { GroupName = "Sci-Fi & Dystopia", AdminID = alice.Id },
                new Group { GroupName = "World Literature", AdminID = bob.Id }
            );
            await db.SaveChangesAsync();
        }

        // ── Members ───────────────────────────────────────────────────────────
        if (!await db.UserGroups.AnyAsync() && bob != null && alice != null && carol != null && dave != null)
        {
            var groups = await db.Groups.ToListAsync();
            var classicLit = groups.FirstOrDefault(g => g.GroupName == "Classic Lit Club");
            var sciFi = groups.FirstOrDefault(g => g.GroupName == "Sci-Fi & Dystopia");
            var worldLit = groups.FirstOrDefault(g => g.GroupName == "World Literature");

            var memberships = new List<UserGroup>();

            if (classicLit != null)
            {
                memberships.Add(new UserGroup { UserID = bob.Id, GroupID = classicLit.GroupID });
                memberships.Add(new UserGroup { UserID = carol.Id, GroupID = classicLit.GroupID });
                memberships.Add(new UserGroup { UserID = dave.Id, GroupID = classicLit.GroupID });
            }
            if (sciFi != null)
            {
                memberships.Add(new UserGroup { UserID = alice.Id, GroupID = sciFi.GroupID });
                memberships.Add(new UserGroup { UserID = carol.Id, GroupID = sciFi.GroupID });
            }
            if (worldLit != null)
            {
                memberships.Add(new UserGroup { UserID = bob.Id, GroupID = worldLit.GroupID });
                memberships.Add(new UserGroup { UserID = dave.Id, GroupID = worldLit.GroupID });
            }

            db.UserGroups.AddRange(memberships);
            await db.SaveChangesAsync();
        }

        // ── Group Books ───────────────────────────────────────────────────────
        if (!await db.GroupBooks.AnyAsync())
        {
            var groups = await db.Groups.ToListAsync();
            var books = await db.Books.ToListAsync();

            var classicLit = groups.FirstOrDefault(g => g.GroupName == "Classic Lit Club");
            var sciFi = groups.FirstOrDefault(g => g.GroupName == "Sci-Fi & Dystopia");
            var worldLit = groups.FirstOrDefault(g => g.GroupName == "World Literature");

            Book? Get(string title) => books.FirstOrDefault(b => b.Title == title);

            var groupBooks = new List<GroupBook>();

            if (classicLit != null)
            {
                if (Get("The Great Gatsby") is { } b1) groupBooks.Add(new GroupBook { GroupID = classicLit.GroupID, BId = b1.BId });
                if (Get("To Kill a Mockingbird") is { } b2) groupBooks.Add(new GroupBook { GroupID = classicLit.GroupID, BId = b2.BId });
                if (Get("Pride and Prejudice") is { } b3) groupBooks.Add(new GroupBook { GroupID = classicLit.GroupID, BId = b3.BId });
            }
            if (sciFi != null)
            {
                if (Get("1984") is { } b4) groupBooks.Add(new GroupBook { GroupID = sciFi.GroupID, BId = b4.BId });
                if (Get("The Fellowship of the Ring") is { } b5) groupBooks.Add(new GroupBook { GroupID = sciFi.GroupID, BId = b5.BId });
            }
            if (worldLit != null)
            {
                if (Get("Beloved") is { } b6) groupBooks.Add(new GroupBook { GroupID = worldLit.GroupID, BId = b6.BId });
                if (Get("One Hundred Years of Solitude") is { } b7) groupBooks.Add(new GroupBook { GroupID = worldLit.GroupID, BId = b7.BId });
                if (Get("Crime and Punishment") is { } b8) groupBooks.Add(new GroupBook { GroupID = worldLit.GroupID, BId = b8.BId });
            }

            db.GroupBooks.AddRange(groupBooks);
            await db.SaveChangesAsync();
        }

        // ── Schedules ─────────────────────────────────────────────────────────
        if (!await db.GroupSchedules.AnyAsync())
        {
            var groups = await db.Groups.ToListAsync();
            var books = await db.Books.ToListAsync();

            var classicLit = groups.FirstOrDefault(g => g.GroupName == "Classic Lit Club");
            var sciFi = groups.FirstOrDefault(g => g.GroupName == "Sci-Fi & Dystopia");

            Book? Get(string title) => books.FirstOrDefault(b => b.Title == title);

            var schedules = new List<GroupSchedule>();

            if (classicLit != null)
            {
                if (Get("The Great Gatsby") is { } b1)
                    schedules.Add(new GroupSchedule
                    {
                        GroupID = classicLit.GroupID,
                        BId = b1.BId,
                        DateTime = DateTime.Now.AddDays(7),
                        Duration = 90,
                        Location = "Central Library, Room 2B"
                    });

                if (Get("To Kill a Mockingbird") is { } b2)
                    schedules.Add(new GroupSchedule
                    {
                        GroupID = classicLit.GroupID,
                        BId = b2.BId,
                        DateTime = DateTime.Now.AddDays(21),
                        Duration = 60,
                        Location = "Coffee House on Main St"
                    });
            }

            if (sciFi != null)
            {
                if (Get("1984") is { } b3)
                    schedules.Add(new GroupSchedule
                    {
                        GroupID = sciFi.GroupID,
                        BId = b3.BId,
                        DateTime = DateTime.Now.AddDays(14),
                        Duration = 120,
                        Location = "Online - Zoom"
                    });
            }

            db.GroupSchedules.AddRange(schedules);
            await db.SaveChangesAsync();
        }
    }
}