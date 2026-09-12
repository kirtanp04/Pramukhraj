const CustomerApiPaths = {
  product: {
    getHomeGroups: "products/customer/home-product-groups",
    getImagesByIds: "products/customer/get-product-images",
  },
  productCategory: {
    getList: "products/customer/category/get-list",
    getImagesListByIds: "products/customer/category/get-category-images",
  },
  review: {
    getTopTestimonials: "review/customer/top-testimonials",
  },
  faq: {
    getHome: "faqs/customer/home",
  },
};

const AdminApiPaths = {
  auth: {
    // I have removed the invisible character from the line below:
    login: "auth/admin/login",
    refresh: "auth/admin/refresh",
  },
  adminAction: {
    getList: (pageNumber: number) =>
      `admin/get-admin-actions?pageNumber=${pageNumber}`,
  },
  product: {
    add: "products/admin/add",
    getById: (id: string) => `products/admin/${encodeURIComponent(id)}`,
    update: (id: string) => `products/admin/${encodeURIComponent(id)}`,
     getAdminList: (pageNumber: number) =>
      "products/admin/get-list/" + pageNumber,
     getImagesListByIds: "products/admin/get-product-images",
     getComboList: "products/admin/get-combo-list",
  },
  inventory: {
    getAdminList: (pageNumber: number) =>
      `products/admin/get-inventory-list/${pageNumber}`,
    getImagesListByProductIds: "products/admin/get-product-images",
    updateVariant: "products/admin/inventory/variant",
  },
  productCategory: {
    add: "products/admin/category/add",
    getById: (id: string) => `products/admin/category/${encodeURIComponent(id)}`,
    update: (id: string) => `products/admin/category/${encodeURIComponent(id)}`,
    getComboList: "products/admin/category/get-combo-list",
    getAdminList: (pageNumber: number) =>
      "products/admin/category/get-list/" + pageNumber,
    getImagesListByIds: "products/admin/category/get-category-images",
  },
  coupon: {
    create: "admin/coupons",
    getList: "admin/coupons",
    getById: (id: string) => `admin/coupons/${encodeURIComponent(id)}`,
    update: (id: string) => `admin/coupons/${encodeURIComponent(id)}`,
    archive: (id: string) => `admin/coupons/${encodeURIComponent(id)}`,
  },
  review: {
    create: "review/admin/add",
    getById: (id: string) => `review/admin/${encodeURIComponent(id)}`,
    update: (id: string) => `review/admin/${encodeURIComponent(id)}`,
    getList: (pageNumber: number) =>
      `review/admin/get-list/${pageNumber}`,
  },
  faq: {
    create: "admin/faqs",
    getList: (pageNumber: number) => `admin/faqs?pageNumber=${pageNumber}`,
    getById: (id: string) => `admin/faqs/${encodeURIComponent(id)}`,
    update: (id: string) => `admin/faqs/${encodeURIComponent(id)}`,
  },
};

export const ApiPath = {
  admin: AdminApiPaths,
  customer: CustomerApiPaths,
};
