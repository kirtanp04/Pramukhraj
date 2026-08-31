export interface ProductCategoryListRouteState {
  createdCategoryId: string;
}

export interface AdminCategoryList {
  imageurl: string;
  name: string;
  id: string;
  description: string | null;
  displayOrder: number;
  productCount: number;
  slug: string;
  isActive: boolean | null;
  isFeatured: boolean | null;
  createdOn: string;
}

export interface CategoryImage {
  categoryId: string;
  imageurl: string;
}

export interface GetCategoryImagesRequestPayload {
  categoryIds: string[];
}

export type CategoryImagesDictionary = Record<string, CategoryImage>;

export interface ProductCategoryDetailsResponse {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
}
