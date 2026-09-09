export interface CustomerCategoryListItem {
  categoryId: string;
  categoryName: string;
  slug: string;
  productCount: number;
}

export interface CustomerCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}
