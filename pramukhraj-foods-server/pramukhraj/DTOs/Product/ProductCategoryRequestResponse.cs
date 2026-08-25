namespace pramukhraj.DTOs.Product
{
    public class ProductCategoryRequestResponse
    {
        public class ProductCategorylistResponse
        {
            public string Imageurl { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Id { get; set; } = string.Empty;
            public string? Description { get; set; }
            public int DisplayOrder { get; set; } = 0;
            public int ProductCount { get; set; } = 0;
            public string Slug { get; set; } = string.Empty;
            public bool? IsActive { get; set; } 
            public bool? IsFeatured { get; set; } 
            public string CreatedOn { get; set; } = string.Empty;
        }

        public class ProductCategoryImagesResponse
        {
            public string Imageurl { get; set; } = string.Empty;
            public string CategoryId { get; set; } = string.Empty;
        }

        public class GetProductCategoriesImagesRequest
        {
            public List<string> CategoryIds { get; set; } = new List<string>();
        }

    }
}
