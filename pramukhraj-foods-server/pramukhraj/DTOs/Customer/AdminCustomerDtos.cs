namespace pramukhraj.DTOs.Customer;

public static class AdminCustomerStatuses
{
    public const string All = "ALL";
    public const string Active = "ACTIVE";
    public const string Inactive = "INACTIVE";
    public const string Blocked = "BLOCKED";
    public const string Deleted = "DELETED";
}

public sealed class AdminCustomerListRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string Status { get; set; } = AdminCustomerStatuses.All;
    public string SortBy { get; set; } = "createdOn";
    public string SortDirection { get; set; } = "desc";
}

public sealed record AdminCustomerListItemResponse(
    Guid Id,
    string FullName,
    string MobileNumber,
    string? Email,
    string? City,
    string? State,
    string Status,
    bool IsMobileVerified,
    bool IsEmailVerified,
    bool IsProfileCompleted,
    bool MarketingConsent,
    int AddressCount,
    int ReviewCount,
    DateTime? LastLoginOn,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    string ConcurrencyStamp);

public sealed record AdminCustomerSummaryResponse(
    int Total,
    int Active,
    int Blocked,
    int Inactive,
    int Deleted);

public sealed record AdminCustomerListPageResponse(
    IReadOnlyList<AdminCustomerListItemResponse> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    AdminCustomerSummaryResponse Summary);

public sealed record AdminCustomerAddressResponse(
    Guid Id,
    string RecipientName,
    string MobileNumber,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string? Landmark,
    string AddressType,
    bool IsDefaultShipping,
    bool IsDefaultBilling,
    bool IsActive,
    DateTime CreatedOn,
    DateTime UpdatedOn);

public sealed record AdminCustomerDetailsResponse(
    Guid Id,
    string FullName,
    string MobileNumber,
    string? Email,
    string? City,
    string? State,
    string? PostalCode,
    string Status,
    string? BlockReason,
    DateTime? BlockedOn,
    bool IsMobileVerified,
    bool IsEmailVerified,
    bool IsProfileCompleted,
    bool MarketingConsent,
    DateTime? MarketingConsentOn,
    DateTime? LastLoginOn,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    DateTime? DeletedOn,
    int ReviewCount,
    int ActiveCartCount,
    int ConvertedCartCount,
    int ActiveSessionCount,
    string ConcurrencyStamp,
    IReadOnlyList<AdminCustomerAddressResponse> Addresses);

public sealed class PatchAdminCustomerRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public bool MarketingConsent { get; set; }
    public string Status { get; set; } = AdminCustomerStatuses.Active;
    public string? BlockReason { get; set; }
    public string ConcurrencyStamp { get; set; } = string.Empty;
}
