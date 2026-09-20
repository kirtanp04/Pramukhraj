namespace pramukhraj.DTOs.Auth
{
    public sealed class CustomerResponse
    {
        public string CustomerId { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public bool IsMobileVerified { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsProfileCompleted { get; set; }
        public bool MarketingConsent { get; set; }
    }
}
