using System.ComponentModel.DataAnnotations;

namespace pramukhraj.Entities.Return;

/// <summary>
/// Configures refund eligibility rules per return reason.
/// Controls whether product amounts, original shipping charges, and payment fees are refunded.
/// </summary>
public sealed class ReturnReasonPolicy
{
    [Key]
    public ReturnReason Reason { get; set; }

    /// <summary>
    /// Whether the items' purchase cost is refundable for this reason.
    /// </summary>
    public bool RefundProductAmount { get; set; } = true;

    /// <summary>
    /// Whether the original shipping charge paid by customer is refundable for this reason.
    /// </summary>
    public bool RefundShippingAmount { get; set; } = false;

    /// <summary>
    /// Whether the commercial payment processing fee / fee tax paid by customer is refundable for this reason.
    /// </summary>
    public bool RefundPaymentFee { get; set; } = false;

    public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;
}
