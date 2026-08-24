

const GuestApiPaths = {};

const AdminApiPaths = {
  auth: {
    // I have removed the invisible character from the line below:
    login: "auth/admin/login",
    refresh: "auth/admin/refresh",
  },
  product:{
    add:"admin/products/add"
  },
  productCategory: {
    add: "admin/products/category/add",
    getComboList:"admin/products/category/get-combo-list"
  }
};

export const ApiPath = {
  admin: AdminApiPaths,
  guest: GuestApiPaths,
};
