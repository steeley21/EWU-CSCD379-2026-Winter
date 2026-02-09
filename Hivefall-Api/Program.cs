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

    builder.Services.AddDbContext<HivefallDbContext>(opt => opt.UseSqlServer(conn));
}

builder.Services.AddScoped<ILeaderboardService, LeaderboardService>();

WebApplication app = builder.Build();

//  Works for both relational + InMemory
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HivefallDbContext>();
    if (db.Database.IsRelational()) db.Database.Migrate();
    else db.Database.EnsureCreated();
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
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

public partial class Program { }