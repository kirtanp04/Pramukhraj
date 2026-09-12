using pramukhraj.Common;
using pramukhraj.DTOs.FAQ;

namespace pramukhraj.Interfaces;

public interface IFaqService
{
    Task<ApiResponse<Guid>> CreateAsync(FaqWriteRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<Guid>> UpdateAsync(Guid faqId, FaqWriteRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<FaqDetailsResponse>> GetByIdAsync(Guid faqId, CancellationToken cancellationToken = default);
    Task<ApiResponse<FaqListPageResponse>> GetListAsync(int pageNumber, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<CustomerFaqResponse>>> GetCustomerHomeFaqsAsync(CancellationToken cancellationToken = default);
}
