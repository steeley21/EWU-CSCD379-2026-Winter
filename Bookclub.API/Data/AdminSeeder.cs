using BookClubApp.Models;
using Microsoft.AspNetCore.Identity;

namespace BookClubApp.Data;

public static class AdminSeeder
{
    private static readonly string[] AdminUserIds =
    {
        // Add the user IDs of the admin users here
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        if (!await roleManager.RoleExistsAsync("Admin"))
            await roleManager.CreateAsync(new IdentityRole("Admin"));

        foreach (var id in AdminUserIds)
        {
            if (string.IsNullOrWhiteSpace(id)) continue;

            var user = await userManager.FindByIdAsync(id.Trim());
            if (user == null) continue;

            if (!await userManager.IsInRoleAsync(user, "Admin"))
                await userManager.AddToRoleAsync(user, "Admin");
        }
    }
}