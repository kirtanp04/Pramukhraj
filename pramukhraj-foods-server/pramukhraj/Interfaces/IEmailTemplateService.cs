using pramukhraj.Common;
using pramukhraj.DTOs.EmailTemplates;

namespace pramukhraj.Interfaces;

public interface IEmailTemplateService
{
    Task<ApiResponse<Guid>> CreateAsync(EmailTemplateWriteRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<Guid>> UpdateAsync(Guid id, EmailTemplateWriteRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<object>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<EmailTemplateResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<EmailTemplateListItemResponse>>> GetListAsync(CancellationToken cancellationToken = default);
    Task<RenderedEmailTemplate?> RenderActiveAsync(string key, IReadOnlyDictionary<string, string?> variables, CancellationToken cancellationToken = default);
}
