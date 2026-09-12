using static pramukhraj.Entities.FAQs.FAQsEnum;

namespace pramukhraj.DTOs.FAQ;

public sealed class FaqWriteRequest
{
    public FaqCategory Category { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class FaqDetailsResponse
{
    public Guid Id { get; set; }
    public FaqCategory Category { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
}

public sealed class FaqListItemResponse
{
    public Guid Id { get; set; }
    public FaqCategory Category { get; set; }
    public string Question { get; set; } = string.Empty;
    public string AnswerPreview { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; }
    public DateTime UpdatedOn { get; set; }
}

public sealed class FaqListPageResponse
{
    public List<FaqListItemResponse> Items { get; set; } = [];
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}

public sealed class CustomerFaqResponse
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}
