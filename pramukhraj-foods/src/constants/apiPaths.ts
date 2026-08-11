const GuestApiPaths = {};

const AdminApiPaths = {
  auth: {
    // I have removed the invisible character from the line below:
    login: "auth/admin/login",
    refresh: "auth/admin/refresh",
  },
};

export const ApiPath = {
  admin: AdminApiPaths,
  guest: GuestApiPaths,
};