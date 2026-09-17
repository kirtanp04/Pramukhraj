using pramukhraj.Common;
using pramukhraj.DTOs.Customer;

namespace pramukhraj.Interfaces;

public interface ICustomerVerificationService
{
    Task<ApiResponse<CustomerVerificationStatusResponse>> GetStatusAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<VerificationChallengeResponse>> RequestMobileCodeAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerVerificationStatusResponse>> VerifyMobileCodeAsync(VerifyContactCodeRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerVerificationStatusResponse>> UpdateEmailAsync(UpdateCustomerEmailRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<VerificationChallengeResponse>> RequestEmailCodeAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerVerificationStatusResponse>> VerifyEmailCodeAsync(VerifyContactCodeRequest request, CancellationToken cancellationToken = default);
    Task<CustomerAccessDecision> EvaluateAccessAsync(Guid customerId, string? tokenVersion, CancellationToken cancellationToken = default);
}
