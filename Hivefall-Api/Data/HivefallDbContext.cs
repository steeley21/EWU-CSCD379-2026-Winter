using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Hivefall_Api.Models;

namespace Hivefall_Api.Data;

public class HivefallDbContext : DbContext
{
    public HivefallDbContext(DbContextOptions<HivefallDbContext> options) : base(options) { }

    public DbSet<RunResultEntity> RunResults => Set<RunResultEntity>();
    public DbSet<ReviewEntity> Reviews => Set<ReviewEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SQL datetime2 has no timezone; enforce UTC when reading from DB.
        var utcConverter = new ValueConverter<DateTime, DateTime>(
            v => v, // store as-is
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc) // read as UTC
        );

        modelBuilder.Entity<RunResultEntity>()
            .Property(e => e.FinishedAtUtc)
            .HasConversion(utcConverter);

        modelBuilder.Entity<ReviewEntity>()
            .Property(e => e.CreatedAtUtc)
            .HasConversion(utcConverter);
    }
}