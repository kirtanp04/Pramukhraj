export interface HomepageCmsWriteRequest {
  eyebrowBadge: string
  headline: string
  subtext: string
  heroImageBase64: string
  heroImageAltText: string
  happyCustomersCount: string
  happyCustomersLabel: string
  productCount: string
  productCountLabel: string
  averageRating: string
  averageRatingLabel: string
  showShopByCategory: boolean
  showFeaturedProducts: boolean
  showTrendingProducts: boolean
  showBestSellerProducts: boolean
  showNewArrivalProducts: boolean
  showCustomerTestimonials: boolean
  showFaqSection: boolean
}

export interface AdminHomepageCmsResponse extends HomepageCmsWriteRequest {
  id: number
  createdOn: string
  updatedOn: string
}

export interface CustomerHomepageHeroResponse {
  eyebrowBadge: string
  headline: string
  subtext: string
  heroImageBase64: string
  heroImageAltText: string
  happyCustomersCount: string | null
  happyCustomersLabel: string | null
  productCount: string | null
  productCountLabel: string | null
  averageRating: string | null
  averageRatingLabel: string | null
}
