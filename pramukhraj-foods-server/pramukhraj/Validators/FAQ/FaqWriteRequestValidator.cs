using FluentValidation;
using pramukhraj.DTOs.FAQ;

namespace pramukhraj.Validators.FAQ;

public sealed class FaqWriteRequestValidator : AbstractValidator<FaqWriteRequest>
{
    public FaqWriteRequestValidator()
    {
        RuleFor(request => request.Category)
            .IsInEnum()
            .WithMessage("FAQ category is invalid.");

        RuleFor(request => request.Question)
            .Must(question => !string.IsNullOrWhiteSpace(question))
            .WithMessage("Question is required.")
            .MaximumLength(500)
            .WithMessage("Question cannot exceed 500 characters.");

        RuleFor(request => request.Answer)
            .Must(answer => !string.IsNullOrWhiteSpace(answer))
            .WithMessage("Answer is required.")
            .MaximumLength(5000)
            .WithMessage("Answer cannot exceed 5,000 characters.");

        RuleFor(request => request.DisplayOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Display order cannot be negative.");
    }
}
