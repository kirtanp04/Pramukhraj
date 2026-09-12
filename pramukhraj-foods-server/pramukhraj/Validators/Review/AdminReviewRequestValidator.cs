using FluentValidation;
using static pramukhraj.DTOs.Review.AdminReviewRequestResponse;
using static pramukhraj.Entities.Review.ReviewEnum;

namespace pramukhraj.Validators.Review
{
    public class AdminReviewRequestValidator : AbstractValidator<CreateAdminReviewRequest>
    {
        public AdminReviewRequestValidator()
        {
            RuleFor(request => request.CustomerName)
                .NotEmpty()
                .WithMessage("Customer name is required.")
                .MaximumLength(120)
                .WithMessage("Customer name cannot exceed 120 characters.");

            RuleFor(request => request.CustomerCity)
                .MaximumLength(100)
                .WithMessage("Customer city cannot exceed 100 characters.");

            RuleFor(request => request.Source)
                .IsInEnum()
                .WithMessage("Review source is invalid.");

            RuleFor(request => request.Status)
                .IsInEnum()
                .WithMessage("Review status is invalid.");

            RuleFor(request => request.Rating)
                .InclusiveBetween(1, 5)
                .WithMessage("Rating must be between 1 and 5.");

            RuleFor(request => request.Title)
                .MaximumLength(150)
                .WithMessage("Review title cannot exceed 150 characters.");

            RuleFor(request => request.Comment)
                .NotEmpty()
                .WithMessage("Review comment is required.")
                .MaximumLength(2000)
                .WithMessage("Review comment cannot exceed 2,000 characters.");


            RuleFor(request => request.HasCustomerConsent)
                .Equal(true)
                .WithMessage(
                    "Customer consent is required before publishing a testimonial.");

            RuleFor(request => request)
                .Must(request =>
                    !request.IsFeatured ||
                    (
                        request.Status == ReviewStatus.Approved &&
                        request.IsActive
                    ))
                .WithMessage(
                    "Only an active and approved testimonial can be featured.");
        }

        private static bool BeValidUrl(string? value)
        {
            return Uri.TryCreate(
                       value?.Trim(),
                       UriKind.Absolute,
                       out var uri) &&
                   (
                       uri.Scheme == Uri.UriSchemeHttp ||
                       uri.Scheme == Uri.UriSchemeHttps
                   );
        }
    }

    public sealed class UpdateAdminReviewRequestValidator: AbstractValidator<UpdateAdminReviewRequest>
    {
        public UpdateAdminReviewRequestValidator()
        {
            RuleFor(request => request.CustomerName)
                .NotEmpty()
                .WithMessage("Customer name is required.")
                .MaximumLength(120)
                .WithMessage("Customer name cannot exceed 120 characters.");

            RuleFor(request => request.CustomerCity)
                .MaximumLength(100)
                .WithMessage("Customer city cannot exceed 100 characters.");

            RuleFor(request => request.Source)
                .IsInEnum()
                .WithMessage("Review source is invalid.");

            RuleFor(request => request.Status)
                .IsInEnum()
                .WithMessage("Review status is invalid.");

            RuleFor(request => request.Rating)
                .InclusiveBetween(1, 5)
                .WithMessage("Rating must be between 1 and 5.");

            RuleFor(request => request.Title)
                .MaximumLength(150)
                .WithMessage("Review title cannot exceed 150 characters.");

            RuleFor(request => request.Comment)
                .NotEmpty()
                .WithMessage("Review comment is required.")
                .MaximumLength(2000)
                .WithMessage("Review comment cannot exceed 2,000 characters.");

            RuleFor(request => request.SourceReference)
                .MaximumLength(500)
                .WithMessage("Source reference cannot exceed 500 characters.")
                .Must(BeValidUrl)
                .When(request =>
                    !string.IsNullOrWhiteSpace(request.SourceReference))
                .WithMessage("Source reference must be a valid HTTP or HTTPS URL.");

            RuleFor(request => request.HasCustomerConsent)
                .Equal(true)
                .WithMessage(
                    "Customer consent is required before publishing a testimonial.");

            RuleFor(request => request.RejectionReason)
                .NotEmpty()
                .When(request =>
                    request.Status == ReviewStatus.Rejected)
                .WithMessage(
                    "A rejection reason is required when rejecting a testimonial.")
                .MaximumLength(500)
                .WithMessage("Rejection reason cannot exceed 500 characters.");

            RuleFor(request => request)
                .Must(request =>
                    !request.IsFeatured ||
                    (
                        request.Status == ReviewStatus.Approved &&
                        request.IsActive
                    ))
                .WithMessage(
                    "Only an active and approved testimonial can be featured.");
        }

        private static bool BeValidUrl(string? value)
        {
            return Uri.TryCreate(
                       value?.Trim(),
                       UriKind.Absolute,
                       out var uri) &&
                   (
                       uri.Scheme == Uri.UriSchemeHttp ||
                       uri.Scheme == Uri.UriSchemeHttps
                   );
        }
    }
}
