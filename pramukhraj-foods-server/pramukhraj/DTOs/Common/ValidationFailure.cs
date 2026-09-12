using pramukhraj.Common;
using FluentValidation.Results;

namespace pramukhraj.DTOs.Common
{
    public class ValidationFailure
    {
        public static ApiResponse<T> Validate<T>(ValidationResult validation, string message) =>
            ApiResponse<T>.Fail(
                message,
                StatusCodes.Status400BadRequest,
                validation.Errors
                    .GroupBy(error => error.PropertyName)
                    .ToDictionary(
                        group => group.Key,
                        group => group.Select(error => error.ErrorMessage).Distinct().ToArray()));
    }
}
