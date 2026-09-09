namespace pramukhraj.Entities.Review
{
    public class ReviewEnum
    {
        public enum ReviewType
        {
            ProductReview = 1,
            BrandTestimonial = 2
        }

        public enum ReviewSource
        {
            Website = 1,
            OfflineStore = 2,
            WhatsApp = 3,
            Instagram = 4,
            Google = 5,
            Distributor = 6
        }

        public enum ReviewStatus
        {
            Pending = 1,
            Approved = 2,
            Rejected = 3
        }
    }
}
