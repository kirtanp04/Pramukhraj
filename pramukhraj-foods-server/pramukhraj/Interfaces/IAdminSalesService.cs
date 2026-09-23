using pramukhraj.Common;
using pramukhraj.DTOs.Sales;

namespace pramukhraj.Interfaces;

public interface IAdminSalesService
{
    Task<ApiResponse<AdminSalesReportResponse>> GetSalesReportAsync(AdminSalesReportRequest request, CancellationToken cancellationToken = default);
    Task<(byte[] CsvBytes, string FileName)> ExportSalesReportCsvAsync(AdminSalesReportRequest request, CancellationToken cancellationToken = default);
    Task<(byte[] ExcelBytes, string FileName)> ExportSalesReportExcelAsync(AdminSalesReportRequest request, CancellationToken cancellationToken = default);
    void InvalidateSalesCache(string? reason = null);
}

