using Microsoft.EntityFrameworkCore;
using Hivefall_Api.Models;

namespace Hivefall_Api.Data;

public class HivefallDbContext : DbContext
{
    public HivefallDbContext(DbContextOptions<HivefallDbContext> options) : base(options) { }

    public DbSet<RunResultEntity> RunResults => Set<RunResultEntity>();
}