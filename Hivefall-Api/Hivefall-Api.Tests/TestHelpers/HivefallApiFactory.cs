using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Hivefall_Api.Tests.TestHelpers;

public sealed class HivefallApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"HivefallTests_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["InMemoryDbName"] = _dbName
            });
        });
    }
}