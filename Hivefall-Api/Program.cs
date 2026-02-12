using Hivefall_Api.Data;
using Hivefall_Api.Services;
using Microsoft.EntityFrameworkCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

const string ClientCors = "ClientCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(ClientCors, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://blue-cliff-07b9aa10f.4.azurestaticapps.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

//  DB provider selection
if (builder.Environment.IsEnvironment("Testing"))
{
    // Let tests inject a unique name via config; fallback is fine.
    var dbName = builder.Configuration["InMemoryDbName"] ?? "Hivefall_TestDb";
    builder.Services.AddDbContext<HivefallDbContext>(opt => opt.UseInMemoryDatabase(dbName));
}
else
{
    var conn = builder.Configuration.GetConnectionString("DefaultConnection")
               ?? throw new InvalidOperationException("Missing connection string 'DefaultConnection'");
    
    builder.Services.AddDbContext<HivefallDbContext>(opt =>
        opt.UseSqlServer(conn, sql =>
        {
            sql.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null
            );
            sql.CommandTimeout(60);
        })
    );
}

builder.Services.AddScoped<ILeaderboardService, LeaderboardService>();

WebApplication app = builder.Build();

// Attempt DB init with retries to handle cold SQL instances; log failures but keep API running for non-DB endpoints.
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var db = scope.ServiceProvider.GetRequiredService<HivefallDbContext>();

    var initialized = false;

    for (var attempt = 1; attempt <= 5; attempt++)
    {
        try
        {
            if (db.Database.IsRelational()) await db.Database.MigrateAsync();
            else await db.Database.EnsureCreatedAsync();

            initialized = true;
            break;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "DB init attempt {Attempt} failed.", attempt);
            await Task.Delay(TimeSpan.FromSeconds(attempt * 2));
        }
    }

    if (!initialized)
    {
        logger.LogError("DB init failed after retries; API will start but DB-backed endpoints may return 503 until SQL is awake.");
    }
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors(ClientCors);
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", async (HivefallDbContext db) =>
{
    await db.Database.ExecuteSqlRawAsync("SELECT 1");
    return Results.Ok(new { status = "ok" });
});

app.Run();

public partial class Program { }