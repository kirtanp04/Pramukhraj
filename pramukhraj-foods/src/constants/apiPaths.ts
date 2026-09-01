const GuestApiPaths = {};

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
};

export const ApiPath = {
  admin: AdminApiPaths,
  guest: GuestApiPaths,
};
