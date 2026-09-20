namespace pramukhraj.DTOs.Customer;

public sealed class CustomerAddressWriteRequest
{
    public string RecipientName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string? Landmark { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public string AddressType { get; set; } = "Home";
    public bool IsDefaultShipping { get; set; }
    public bool IsDefaultBilling { get; set; }
    public string? ConcurrencyStamp { get; set; }
}

public sealed record CustomerAddressResponse(
    Guid Id,
    string RecipientName,
    string MobileNumber,
    string? Email,
    string AddressLine1,
    string? AddressLine2,
    string? Landmark,
    string City,
    string State,
    string PostalCode,
    string Country,
    string AddressType,
    bool IsDefaultShipping,
    bool IsDefaultBilling,
    string ConcurrencyStamp,
    DateTime CreatedOn,
    DateTime UpdatedOn);
