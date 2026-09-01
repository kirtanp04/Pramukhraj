using System.Text.Json.Serialization;

namespace pramukhraj.Entities.Coupon
{
    public class CouponEnums
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum CouponDiscountType
        {
            Percentage = 1,
            FlatAmount = 2,
            FreeShipping = 3
        }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum CouponApplicationScope
        {
            AllProducts = 1,
            SpecificProducts = 2,
            SpecificCategories = 3
        }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum CouponScopeType
        {
            Product = 1,
            Category = 2
        }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum CouponUsageStatus
        {
            Reserved = 1,
            Redeemed = 2,
            Released = 3
        }
    }
}
