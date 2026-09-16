using FluentValidation;
using pramukhraj.DTOs.Customer;

namespace pramukhraj.Validators.Customer;

public sealed class AdminCustomerListRequestValidator : AbstractValidator<AdminCustomerListRequest>
{
    private static readonly string[] Statuses =
        [AdminCustomerStatuses.All, AdminCustomerStatuses.Active, AdminCustomerStatuses.Inactive, AdminCustomerStatuses.Blocked, AdminCustomerStatuses.Deleted];
    private static readonly string[] SortFields = ["createdOn", "updatedOn", "fullName", "lastLoginOn"];

    public AdminCustomerListRequestValidator()
    {
        RuleFor(x => x.PageNumber).InclusiveBetween(1, 1_000_000);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.Search).MaximumLength(120);
        RuleFor(x => x.Status).Cascade(CascadeMode.Stop).NotEmpty()
            .Must(value => Statuses.Contains(value.Trim().ToUpperInvariant()))
            .WithMessage("Status must be ALL, ACTIVE, INACTIVE, BLOCKED, or DELETED.");
        RuleFor(x => x.SortBy).Cascade(CascadeMode.Stop).NotEmpty()
            .Must(value => SortFields.Contains(value.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("SortBy must be createdOn, updatedOn, fullName, or lastLoginOn.");
        RuleFor(x => x.SortDirection).Cascade(CascadeMode.Stop).NotEmpty()
            .Must(value => value.Equals("asc", StringComparison.OrdinalIgnoreCase) || value.Equals("desc", StringComparison.OrdinalIgnoreCase))
            .WithMessage("SortDirection must be asc or desc.");
    }
}

public sealed class PatchAdminCustomerRequestValidator : AbstractValidator<PatchAdminCustomerRequest>
{
    private static readonly string[] EditableStatuses =
        [AdminCustomerStatuses.Active, AdminCustomerStatuses.Inactive, AdminCustomerStatuses.Blocked];

    public PatchAdminCustomerRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).MaximumLength(256).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.City).MaximumLength(100);
        RuleFor(x => x.State).MaximumLength(100);
        RuleFor(x => x.PostalCode).MaximumLength(10)
            .Matches("^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$")
            .When(x => !string.IsNullOrWhiteSpace(x.PostalCode))
            .WithMessage("Postal code contains invalid characters.");
        RuleFor(x => x.Status).Cascade(CascadeMode.Stop).NotEmpty()
            .Must(value => EditableStatuses.Contains(value.Trim().ToUpperInvariant()))
            .WithMessage("Status must be ACTIVE, INACTIVE, or BLOCKED.");
        RuleFor(x => x.BlockReason).NotEmpty().MaximumLength(500)
            .When(x => string.Equals(x.Status, AdminCustomerStatuses.Blocked, StringComparison.OrdinalIgnoreCase));
        RuleFor(x => x.BlockReason).MaximumLength(500);
        RuleFor(x => x.ConcurrencyStamp).NotEmpty().Length(32).Matches("^[a-fA-F0-9]{32}$")
            .WithMessage("The customer version is invalid. Refresh and try again.");
    }
}
