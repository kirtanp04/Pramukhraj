namespace pramukhraj.Common
{
    public static class CacheKey
    {
        private const string Prefix = "pramukhraj";

        public static class Products
        {
            private const string Base = $"{Prefix}:products";

            public static string Details(Guid productId)
                => $"{Base}:details:{productId}";

            public static string List(int pageNumber)
                => $"{Base}:list:page:{pageNumber}";

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

            public static string Images(Guid productId)
                => $"{Base}:images:{productId}";
        }

        public static class Categories
        {
            private const string Base = $"{Prefix}:categories";

            public static string Details(Guid categoryId)
                => $"{Base}:details:{categoryId}";

            public static string List(int pageNumber)
                => $"{Base}:list:page:{pageNumber}";

            public static string ListPrefix
                => $"{Base}:list:";

            public static string Combo
                => $"{Base}:combo";

            public static string Images
                => $"{Base}:images";
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
    }
}
