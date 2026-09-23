using FluentValidation;
using pramukhraj.DTOs.Return;
using pramukhraj.Entities.Return;

namespace pramukhraj.Validators.Return;

public sealed class CreateReturnRequestValidator : AbstractValidator<CreateReturnRequest>
{
    public CreateReturnRequestValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item must be selected for return.")
            .Must(items => items != null && items.All(i => i.Quantity > 0))
            .WithMessage("Return quantity must be greater than zero for all selected items.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.OrderItemId).NotEmpty().WithMessage("Valid Order Item ID is required.");
            item.RuleFor(i => i.Quantity).GreaterThan(0).WithMessage("Quantity must be greater than zero.");
        });

        RuleFor(x => x.Reason)
            .IsInEnum().WithMessage("A valid return reason must be selected.");

        RuleFor(x => x.Resolution)
            .IsInEnum().WithMessage("A valid return resolution must be selected.");

        RuleFor(x => x.CustomerComments)
            .NotEmpty().WithMessage("Comments explaining the reason for return are required.")
            .MaximumLength(1000).WithMessage("Comments cannot exceed 1000 characters.");

        RuleFor(x => x.Media)
            .Must(m => m == null || m.Count <= 5)
            .WithMessage("A maximum of 5 proof images can be uploaded.");
    }
}

public sealed class AdminApproveReturnRequestValidator : AbstractValidator<AdminApproveReturnRequest>
{
    public AdminApproveReturnRequestValidator()
    {
        RuleFor(x => x.ReverseShippingDeduction)
            .GreaterThanOrEqualTo(0m).WithMessage("Reverse shipping deduction cannot be negative.");

        RuleFor(x => x.AdminNotes)
            .MaximumLength(1000).WithMessage("Admin notes cannot exceed 1000 characters.");
    }
}

public sealed class AdminRejectReturnRequestValidator : AbstractValidator<AdminRejectReturnRequest>
{
    public AdminRejectReturnRequestValidator()
    {
        RuleFor(x => x.RejectionReason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MaximumLength(500).WithMessage("Rejection reason cannot exceed 500 characters.");
    }
}

public sealed class AdminInspectReturnRequestValidator : AbstractValidator<AdminInspectReturnRequest>
{
    public AdminInspectReturnRequestValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Inspection results must be provided for all items.")
            .Must(items => items != null && items.All(i => i.Outcome == InspectionOutcome.Passed || i.Outcome == InspectionOutcome.Failed))
            .WithMessage("Each inspected item must have an outcome of either Passed or Failed.");

        RuleFor(x => x.InspectionNotes)
            .MaximumLength(1000).WithMessage("Inspection notes cannot exceed 1000 characters.");
    }
}

public sealed class ScheduleReversePickupRequestValidator : AbstractValidator<ScheduleReversePickupRequest>
{
    public ScheduleReversePickupRequestValidator()
    {
        RuleFor(x => x.CourierName)
            .NotEmpty().WithMessage("Courier/carrier name is required.")
            .MaximumLength(100).WithMessage("Courier name cannot exceed 100 characters.");

        RuleFor(x => x.TrackingNumber)
            .NotEmpty().WithMessage("Reverse AWB / Tracking number is required.")
            .MaximumLength(100).WithMessage("Tracking number cannot exceed 100 characters.");

        RuleFor(x => x.TrackingUrl)
            .MaximumLength(500).WithMessage("Tracking URL cannot exceed 500 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.");
    }
}

public sealed class UpdateReverseTrackingRequestValidator : AbstractValidator<UpdateReverseTrackingRequest>
{
    public UpdateReverseTrackingRequestValidator()
    {
        RuleFor(x => x.Status)
            .Must(s => s == ReturnStatus.InTransit || s == ReturnStatus.DeliveredToWarehouse)
            .WithMessage("Status must be either 'InTransit' or 'DeliveredToWarehouse'.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.");
    }
}

