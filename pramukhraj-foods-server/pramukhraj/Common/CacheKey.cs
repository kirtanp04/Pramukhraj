namespace pramukhraj.Common
{
    public static class CacheKey
    {
        private const string Prefix = "pramukhraj";

        public static class Products
        {
            private const string Base = $"{Prefix}:products";

            public static string AllPrefix => $"{Base}:";

            public static string Details(Guid productId)
                => $"{Base}:details:{productId}";

            public static string List(int pageNumber, int timeZoneOffset = 0)
                => $"{Base}:list:page:{pageNumber}:tz:{timeZoneOffset}";

            public static string ListPrefix
                => $"{Base}:list:";

            public static string Featured
                => $"{Base}:featured";

            public static string BestSeller
                => $"{Base}:best-seller";

            public static string Trending
                => $"{Base}:trending";

            public static string NewArrivals
                => $"{Base}:new-arrivals";

            public static string Combo => $"{Base}:combo";

            public static string Images(IEnumerable<Guid> productIds)
                => $"{Base}:images:{NormalizeIds(productIds)}";

            public static string Inventory(int pageNumber)
                => $"{Base}:inventory:page:{pageNumber}";

            public static string CustomerHome => $"{Base}:customer-home";
        }

        public static class Categories
        {
            private const string Base = $"{Prefix}:categories";

            public static string AllPrefix => $"{Base}:";

            public static string Details(Guid categoryId)
                => $"{Base}:details:{categoryId}";

            public static string List(int pageNumber, int timeZoneOffset = 0)
                => $"{Base}:list:page:{pageNumber}:tz:{timeZoneOffset}";

            public static string ListPrefix
                => $"{Base}:list:";

            public static string Combo
                => $"{Base}:combo";

            public static string Images(IEnumerable<Guid> categoryIds)
                => $"{Base}:images:{NormalizeIds(categoryIds)}";

            public static string CustomerList => $"{Base}:customer-list";
        }

        public static class Reviews
        {
            private const string Base = $"{Prefix}:reviews";

            public static string AllPrefix => $"{Base}:";
            public static string Details(Guid reviewId) => $"{Base}:details:{reviewId}";
            public static string TopTestimonials => $"{Base}:top-testimonials";
            public static string List(int pageNumber, int timeZoneOffset)
                => $"{Base}:list:page:{pageNumber}:tz:{timeZoneOffset}";
        }

        public static class Coupons
        {
            private const string Base = $"{Prefix}:coupons";

            public static string AllPrefix => $"{Base}:";
            public static string Details(Guid couponId) => $"{Base}:details:{couponId}";
            public static string List(int pageNumber, int timeZoneOffset)
                => $"{Base}:list:page:{pageNumber}:tz:{timeZoneOffset}";
        }

        public static class Faqs
        {
            private const string Base = $"{Prefix}:faqs";

            public static string CustomerHome => $"{Base}:customer-home";
        }

        public static class HomepageCms
        {
            private const string Base = $"{Prefix}:homepage-cms";

            public static string CustomerHero => $"{Base}:customer-hero";
        }

        public static class Store
        {
            public static string Settings
                => $"{Prefix}:store:settings";

            public static string Home
                => $"{Prefix}:store:home";

            public static string Shipping
                => $"{Prefix}:store:shipping";
        }

        public static class Sales
        {
            private const string Base = $"{Prefix}:sales";

            public static string AllPrefix => $"{Base}:";

            public static string Report(DateTime start, DateTime end, string status, string granularity)
                => $"{Base}:report:s:{start:yyyyMMddHHmmss}:e:{end:yyyyMMddHHmmss}:st:{status.ToLowerInvariant()}:g:{granularity.ToLowerInvariant()}";
        }

        private static string NormalizeIds(IEnumerable<Guid> ids)
            => string.Join(',', ids.Distinct().OrderBy(id => id));
    }
}
