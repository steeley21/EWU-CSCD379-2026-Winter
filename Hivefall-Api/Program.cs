// Program.cs
using Hivefall_Api.Data;
using Hivefall_Api.Services;
using Microsoft.EntityFrameworkCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Controllers (API)
builder.Services.AddControllers();

// Swagger (API documentation UI)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS (allow Nuxt dev server)
const string ClientCors = "ClientCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(ClientCors, policy =>
    {
        policy
            .WithOrigins("http://localhost:3000") // Nuxt dev default
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var conn = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(conn))
    throw new InvalidOperationException("Missing connection string 'DefaultConnection'");


builder.Services.AddDbContext<HivefallDbContext>(options =>
{
    if (builder.Environment.IsDevelopment())
        options.UseSqlite(conn);
    else
        options.UseSqlServer(conn);
});


builder.Services.AddScoped<ILeaderboardService, LeaderboardService>();

WebApplication app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HivefallDbContext>();
    db.Database.Migrate();
}


// Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Recommended pipeline order
app.UseHttpsRedirection();

app.UseRouting();

app.UseCors(ClientCors);

app.UseAuthorization();

// Map API endpoints
app.MapControllers();

// Simple health check endpoint (useful for Azure + quick checks)
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

public partial class Program{ }