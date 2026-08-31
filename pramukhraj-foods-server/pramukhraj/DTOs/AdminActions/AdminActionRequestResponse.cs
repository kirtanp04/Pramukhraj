namespace pramukhraj.DTOs.AdminActions
{
    public class AdminActionRequestResponse
    {
        
        public sealed class AdminActionResponse
        {
            public Guid? Id { get; init; }
            public Guid? AdminId { get; init; }
            public string AdminName { get; init; } = string.Empty;
            public string Module { get; init; } = string.Empty;
            public string Action { get; init; } = string.Empty;
            public Guid? EntityId { get; init; }
            public string EntityName { get; init; } = string.Empty;
            public string Description { get; init; } = string.Empty;
            public string CreatedOn { get; init; } = string.Empty;
        }
    }
}
