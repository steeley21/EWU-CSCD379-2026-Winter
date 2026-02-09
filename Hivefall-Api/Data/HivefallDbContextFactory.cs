using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Hivefall_Api.Data;

public sealed class HivefallDbContextFactory : IDesignTimeDbContextFactory<HivefallDbContext>
{
    public HivefallDbContext CreateDbContext(string[] args)
    {
        IConfiguration config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        // EF tooling needs *something* here at design time.
        // This can be your local SQL Server or a LocalDB string.
        string? conn = config.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(conn))
        {
            conn = @"Server=(localdb)\MSSQLLocalDB;Database=HivefallDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
        }

        var options = new DbContextOptionsBuilder<HivefallDbContext>()
            .UseSqlServer(conn)
            .Options;

        return new HivefallDbContext(options);
    }
}