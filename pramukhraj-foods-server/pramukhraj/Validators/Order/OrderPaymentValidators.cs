using FluentValidation;
using pramukhraj.DTOs.Order;

namespace pramukhraj.Validators.Order;

public sealed class PlaceOrderRequestValidator : AbstractValidator<PlaceOrderRequest>
{
    public PlaceOrderRequestValidator()
    {
        RuleFor(x => x.CheckoutSessionId).NotEmpty();
        RuleFor(x => x.CustomerNote).MaximumLength(500);
    }
}

public sealed class VerifyRazorpayPaymentRequestValidator : AbstractValidator<VerifyRazorpayPaymentRequest>
{
    public VerifyRazorpayPaymentRequestValidator()
    {
        RuleFor(x => x.RazorpayOrderId).NotEmpty().MaximumLength(100).Matches("^order_[A-Za-z0-9]+$");
        RuleFor(x => x.RazorpayPaymentId).NotEmpty().MaximumLength(100).Matches("^pay_[A-Za-z0-9]+$");
        RuleFor(x => x.RazorpaySignature).NotEmpty().Length(64).Matches("^[a-fA-F0-9]{64}$");
    }
}
