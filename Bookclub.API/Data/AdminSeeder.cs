using BookClubApp.Models;
using Microsoft.AspNetCore.Identity;

namespace BookClubApp.Data;

public static class AdminSeeder
{
    private static readonly string[] AdminUserIds =
    {
        "cf263384-7a99-41b5-a927-b29915e484a2", 
        "055d4e35-c62c-4835-a947-f175248ee782" 
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