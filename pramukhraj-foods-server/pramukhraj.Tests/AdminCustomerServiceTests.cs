using System.Reflection;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.Database;
using pramukhraj.DTOs.Customer;
using pramukhraj.Entities;
using pramukhraj.Entities.Customer;
using pramukhraj.Interfaces;
using pramukhraj.Services;
using pramukhraj.Validators.Customer;
using Xunit;

namespace pramukhraj.Tests;

public sealed class AdminCustomerServiceTests
{
    [Fact]
    public async Task List_filters_customers_and_returns_unfiltered_status_summary()
    {
        await using var fixture = await CustomerServiceFixture.CreateAsync();
        fixture.Db.Customers.AddRange(
            Customer("Active customer", "+919000000001"),
            Customer("Blocked customer", "+919000000002", blocked: true),
            Customer("Inactive customer", "+919000000003", active: false));
        await fixture.Db.SaveChangesAsync();

        var response = await fixture.Service.GetListAsync(new AdminCustomerListRequest
        {
            Status = AdminCustomerStatuses.Active,
            PageSize = 10
        });

        Assert.True(response.Success);
        Assert.Single(response.Data!.Items);
        Assert.Equal("Active customer", response.Data.Items[0].FullName);
        Assert.Equal(3, response.Data.Summary.Total);
        Assert.Equal(1, response.Data.Summary.Active);
        Assert.Equal(1, response.Data.Summary.Blocked);
        Assert.Equal(1, response.Data.Summary.Inactive);
    }

    [Fact]
    public async Task Blocking_customer_revokes_sessions_increments_token_version_and_writes_audit_log()
    {
        await using var fixture = await CustomerServiceFixture.CreateAsync();
        var customer = Customer("Customer", "+919000000004");
        var session = new CustomerRefreshTokens
        {
            Id = Guid.NewGuid(), Customer = customer, CustomerId = customer.Id,
            TokenHash = Guid.NewGuid().ToString("N"), CreatedOn = DateTime.UtcNow,
            ExpiresOn = DateTime.UtcNow.AddDays(1)
        };
        fixture.Db.AddRange(customer, session);
        await fixture.Db.SaveChangesAsync();

        var response = await fixture.Service.PatchAsync(customer.Id, new PatchAdminCustomerRequest
        {
            FullName = customer.FullName,
            Email = "customer@example.com",
            MarketingConsent = false,
            Status = AdminCustomerStatuses.Blocked,
            BlockReason = "Chargeback review",
            ConcurrencyStamp = customer.ConcurrencyStamp
        });

        Assert.True(response.Success);
        Assert.Equal(AdminCustomerStatuses.Blocked, response.Data!.Status);
        var saved = await fixture.Db.Customers.SingleAsync(item => item.Id == customer.Id);
        var savedSession = await fixture.Db.CustomerRefreshTokens.SingleAsync(item => item.Id == session.Id);
        Assert.True(saved.IsBlocked);
        Assert.Equal(2, saved.TokenVersion);
        Assert.NotNull(savedSession.RevokedOn);
        Assert.Equal("Customer", (await fixture.Db.AdminActions.SingleAsync()).Module);
    }

    [Fact]
    public async Task Patch_rejects_stale_concurrency_stamp_without_modifying_customer()
    {
        await using var fixture = await CustomerServiceFixture.CreateAsync();
        var customer = Customer("Original name", "+919000000005");
        fixture.Db.Customers.Add(customer);
        await fixture.Db.SaveChangesAsync();

        var response = await fixture.Service.PatchAsync(customer.Id, new PatchAdminCustomerRequest
        {
            FullName = "Changed name",
            Status = AdminCustomerStatuses.Active,
            ConcurrencyStamp = Guid.NewGuid().ToString("N")
        });

        Assert.False(response.Success);
        Assert.Equal(StatusCodes.Status409Conflict, response.StatusCode);
        Assert.Equal("Original name", (await fixture.Db.Customers.AsNoTracking().SingleAsync()).FullName);
    }

    [Fact]
    public async Task Validators_return_errors_for_missing_status_instead_of_throwing()
    {
        var listResult = await new AdminCustomerListRequestValidator().ValidateAsync(new AdminCustomerListRequest { Status = null! });
        var patchResult = await new PatchAdminCustomerRequestValidator().ValidateAsync(new PatchAdminCustomerRequest
        {
            FullName = "Customer", Status = null!, ConcurrencyStamp = Guid.NewGuid().ToString("N")
        });

        Assert.False(listResult.IsValid);
        Assert.False(patchResult.IsValid);
    }

    private static Customer Customer(string name, string mobile, bool active = true, bool blocked = false) => new()
    {
        Id = Guid.NewGuid(), FullName = name, MobileNumber = mobile,
        IsActive = active, IsBlocked = blocked, IsMobileVerified = true,
        CreatedOn = DateTime.UtcNow, UpdatedOn = DateTime.UtcNow
    };

    private sealed class CustomerServiceFixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;
        public AppDbContext Db { get; }
        public AdminCustomerService Service { get; }

        private CustomerServiceFixture(SqliteConnection connection, AppDbContext db, AdminCustomerService service)
        {
            _connection = connection;
            Db = db;
            Service = service;
        }

        public static async Task<CustomerServiceFixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
            await db.Database.EnsureCreatedAsync();
            var context = new DefaultHttpContext();
            context.Items["UserInfo"] = new ApplicationUser
            {
                Id = Guid.NewGuid().ToString(), UserName = "test-admin", Email = "admin@example.com"
            };
            var validators = DispatchProxy.Create<IValidatorManager, CustomerValidatorManagerProxy>();
            var proxy = (CustomerValidatorManagerProxy)(object)validators;
            proxy.ListValidator = new AdminCustomerListRequestValidator();
            proxy.PatchValidator = new PatchAdminCustomerRequestValidator();
            var service = new AdminCustomerService(
                db,
                NullLogger<AdminCustomerService>.Instance,
                new FixedHttpContextAccessor(context),
                validators);
            return new CustomerServiceFixture(connection, db, service);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }

    public class CustomerValidatorManagerProxy : DispatchProxy
    {
        public IValidator<AdminCustomerListRequest> ListValidator { get; set; } = null!;
        public IValidator<PatchAdminCustomerRequest> PatchValidator { get; set; } = null!;

        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args) => targetMethod?.Name switch
        {
            "get_AdminCustomerListRequest" => ListValidator,
            "get_PatchAdminCustomerRequest" => PatchValidator,
            _ => throw new NotSupportedException(targetMethod?.Name)
        };
    }

    private sealed class FixedHttpContextAccessor(HttpContext context) : IHttpContextAccessor
    {
        public HttpContext? HttpContext { get; set; } = context;
    }
}
