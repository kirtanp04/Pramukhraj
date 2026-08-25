const GuestApiPaths = {};

const AdminApiPaths = {
  auth: {
    // I have removed the invisible character from the line below:
    login: "auth/admin/login",
    refresh: "auth/admin/refresh",
  },
  product: {
    add: "admin/products/add",
     getAdminList: (pageNumber: number) =>
      "admin/products/get-list/" + pageNumber,
     getImagesListByIds: "admin/products/get-product-images",
  },
  productCategory: {
    add: "admin/products/category/add",
    getComboList: "admin/products/category/get-combo-list",
    getAdminList: (pageNumber: number) =>
      "admin/products/category/get-list/" + pageNumber,
    getImagesListByIds: "admin/products/category/get-category-images",
  },
};

export const ApiPath = {
  admin: AdminApiPaths,
  guest: GuestApiPaths,
};
