using System.Data.Common;
using Hivefall_Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Hivefall_Api.Tests.TestHelpers;

public sealed class HivefallApiFactory : WebApplicationFactory<Program>
{
    private SqliteConnection? _connection;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the app's DbContextOptions registration
            var dbOptionsDescriptor = services.SingleOrDefault(d =>
                d.ServiceType == typeof(DbContextOptions<HivefallDbContext>));

            if (dbOptionsDescriptor is not null)
                services.Remove(dbOptionsDescriptor);

            // Remove any existing DbConnection registration (just in case)
            var connDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbConnection));
            if (connDescriptor is not null)
                services.Remove(connDescriptor);

            // Single shared in-memory SQLite connection for the test server lifetime
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            services.AddSingleton<DbConnection>(_ => _connection);

            services.AddDbContext<HivefallDbContext>((sp, options) =>
            {
                var conn = sp.GetRequiredService<DbConnection>();
                options.UseSqlite(conn);
            });
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // IMPORTANT: run schema creation using the *real* host provider
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HivefallDbContext>();
        db.Database.EnsureCreated();

        return host;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _connection?.Dispose();
            _connection = null;
        }
    }
}
