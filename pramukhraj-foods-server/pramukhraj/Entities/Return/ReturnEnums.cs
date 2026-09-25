namespace pramukhraj.Entities.Return;

public enum ReturnStatus
{
    Requested = 1,
    Approved = 2,
    Rejected = 3,
    PickupScheduled = 4,
    PickedUp = 5,
    InTransit = 6,
    DeliveredToWarehouse = 7,
    InspectionPassed = 8,
    InspectionFailed = 9,
    RefundInitiated = 10,
    RefundCompleted = 11,
    Cancelled = 12,
    Closed = 13
}

public enum ReturnReason
{
    DamagedInTransit = 1,
    DefectiveOrExpired = 2,
    WrongItemReceived = 3,
    QualityMismatch = 4,
    MissingItem = 5,
    Other = 6, // Deprecated: Kept for backwards compatibility only; UI exposes explicit reasons
    LateDelivery = 7,
    OrderedByMistake = 8,
    PackageTampered = 9,
    TasteNotAsExpected = 10
}

public enum ReturnResolution
{
    RefundToSource = 1,
    Replacement = 2
}

public enum InspectionOutcome
{
    Pending = 1,
    Passed = 2,
    Failed = 3
}

public enum RefundStatus
{
    Pending = 1,
    Processed = 2,
    Failed = 3
}

