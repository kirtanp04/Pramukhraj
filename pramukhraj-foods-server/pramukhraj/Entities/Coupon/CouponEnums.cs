namespace pramukhraj.Entities.Coupon
{
    public class CouponEnums
    {
        public enum CouponDiscountType
        {
            Percentage = 1,
            FlatAmount = 2,
            FreeShipping = 3
        }

        public enum CouponApplicationScope
        {
            AllProducts = 1,
            SpecificProducts = 2,
            SpecificCategories = 3
        }

        public enum CouponScopeType
        {
            Product = 1,
            Category = 2
        }

    }
}
