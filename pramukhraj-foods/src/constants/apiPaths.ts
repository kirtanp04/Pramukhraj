const CustomerApiPaths = {
  auth: {
    sendOtp: "auth/customer/send-otp",
    verifyOtp: "auth/customer/verify-otp",
    refreshToken: "auth/customer/refresh-token",
    completeProfile: "auth/customer/complete-profile",
    me: "auth/customer/me",
    logout: "auth/customer/logout",
  },
  product: {
    getList: "products/customer/get-list",
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
  homepageCms: {
    getHero: "homepage-cms/customer/hero",
  },
  cart: {
    get: "customer/cart",
    items: "customer/cart/items",
    item: (id: string) => `customer/cart/items/${encodeURIComponent(id)}`,
    selection: (id: string) =>
      `customer/cart/items/${encodeURIComponent(id)}/selection`,
    variant: (id: string) =>
      `customer/cart/items/${encodeURIComponent(id)}/variant`,
    merge: "customer/cart/merge",
  },
  verification: {
    status: "customer/account/verification/status",
    requestMobile: "customer/account/verification/mobile/request",
    verifyMobile: "customer/account/verification/mobile/verify",
    updateEmail: "customer/account/verification/email",
    requestEmail: "customer/account/verification/email/request",
    verifyEmail: "customer/account/verification/email/verify",
  },
  addresses: {
    list: "customer/addresses",
    byId: (id: string) => `customer/addresses/${encodeURIComponent(id)}`,
    defaultShipping: (id: string) => `customer/addresses/${encodeURIComponent(id)}/default-shipping`,
    defaultBilling: (id: string) => `customer/addresses/${encodeURIComponent(id)}/default-billing`,
  },
  checkout: {
    sessions: "customer/checkout/sessions",
    session: (id: string) => `customer/checkout/sessions/${encodeURIComponent(id)}`,
    address: (id: string) => `customer/checkout/sessions/${encodeURIComponent(id)}/address`,
    coupon: (id: string) => `customer/checkout/sessions/${encodeURIComponent(id)}/coupon`,
    refresh: (id: string) => `customer/checkout/sessions/${encodeURIComponent(id)}/refresh`,
    placeOrder: "customer/checkout/place-order",
  },
  payments: {
    verify: (orderId: string) => `customer/orders/${encodeURIComponent(orderId)}/payment/verify`,
    retry: (orderId: string) => `customer/orders/${encodeURIComponent(orderId)}/payment/retry`,
    status: (orderId: string) => `customer/orders/${encodeURIComponent(orderId)}/payment-status`,
    summary: (orderId: string) => `customer/orders/${encodeURIComponent(orderId)}/summary`,
    cancel: (orderId: string) => `customer/orders/${encodeURIComponent(orderId)}/cancel`,
  },
  orders: {
    list: (params?: { page?: number; pageSize?: number; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append("page", params.page.toString());
      if (params?.pageSize) q.append("pageSize", params.pageSize.toString());
      if (params?.status && params.status !== "all") q.append("status", params.status);
      const qs = q.toString();
      return `customer/orders${qs ? `?${qs}` : ""}`;
    },
    detail: (orderId: string) => `customer/orders/${encodeURIComponent(orderId)}`,
    tracking: (orderId: string) => `customer/orders/${encodeURIComponent(orderId)}/tracking`,
    trackPublic: (query: string) => `orders/track?query=${encodeURIComponent(query)}`,
  },
  returns: {
    eligibility: (orderId: string) =>
      `customer/orders/${encodeURIComponent(orderId)}/return-eligibility`,
    create: (orderId: string) =>
      `customer/orders/${encodeURIComponent(orderId)}/returns`,
    list: (params?: { page?: number; pageSize?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append("page", params.page.toString());
      if (params?.pageSize) q.append("pageSize", params.pageSize.toString());
      const qs = q.toString();
      return `customer/returns${qs ? `?${qs}` : ""}`;
    },
    detail: (returnId: string) =>
      `customer/returns/${encodeURIComponent(returnId)}`,
    cancel: (returnId: string) =>
      `customer/returns/${encodeURIComponent(returnId)}/cancel`,
  },
};

const AdminApiPaths = {
  auth: {
    // I have removed the invisible character from the line below:
    login: "auth/admin/login",
    refresh: "auth/admin/refresh",
    logout: "auth/admin/logout",
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
    getById: (id: string) =>
      `products/admin/category/${encodeURIComponent(id)}`,
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
    getList: (pageNumber: number) => `review/admin/get-list/${pageNumber}`,
  },
  faq: {
    create: "admin/faqs",
    getList: (pageNumber: number) => `admin/faqs?pageNumber=${pageNumber}`,
    getById: (id: string) => `admin/faqs/${encodeURIComponent(id)}`,
    update: (id: string) => `admin/faqs/${encodeURIComponent(id)}`,
  },
  homepageCms: {
    get: "admin/homepage-cms",
    replace: "admin/homepage-cms",
  },
  providerCredentials: {
    create: "admin/provider-credentials",
    getByKey: (providerKey: string) =>
      `admin/provider-credentials/${encodeURIComponent(providerKey)}`,
    update: (providerKey: string) =>
      `admin/provider-credentials/${encodeURIComponent(providerKey)}`,
  },
  emailTemplates: {
    list: "admin/email-templates",
    create: "admin/email-templates",
    getById: (id: string) => `admin/email-templates/${encodeURIComponent(id)}`,
    update: (id: string) => `admin/email-templates/${encodeURIComponent(id)}`,
    delete: (id: string) => `admin/email-templates/${encodeURIComponent(id)}`,
  },
  cacheMetrics: {
    get: "admin/cache-metrics",
    clearAll: "admin/cache-metrics",
    clearKey: "admin/cache-metrics/key",
    clearModule: "admin/cache-metrics/module",
  },
  monitoring: {
    background: "admin/monitoring/background",
    server: "admin/monitoring/server",
  },
  notifications: {
    list: (pageNumber: number, pageSize: number, onlyUnacknowledged = false) =>
      `admin/notifications?pageNumber=${pageNumber}&pageSize=${pageSize}&onlyUnacknowledged=${onlyUnacknowledged}`,
    acknowledge: (id: string) => `admin/notifications/${encodeURIComponent(id)}/acknowledge`,
    acknowledgeAll: 'admin/notifications/acknowledge-all',
    stream: 'admin/notifications/stream',
  },
  customers: {
    list: (query: {
      pageNumber: number
      pageSize: number
      search?: string
      status: string
      sortBy: string
      sortDirection: string
    }) => {
      const params = new URLSearchParams({
        pageNumber: String(query.pageNumber),
        pageSize: String(query.pageSize),
        status: query.status,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
      })
      if (query.search) params.set('search', query.search)
      return `admin/customers?${params.toString()}`
    },
    details: (id: string) => `admin/customers/${encodeURIComponent(id)}`,
    patch: (id: string) => `admin/customers/${encodeURIComponent(id)}`,
  },
  orders: {
    list: (query: {
      pageNumber: number
      pageSize: number
      search?: string
      status?: string
      paymentStatus?: string
      shipmentStatus?: string
      sortBy?: string
      sortDirection?: string
    }) => {
      const params = new URLSearchParams({
        pageNumber: String(query.pageNumber),
        pageSize: String(query.pageSize),
      })
      if (query.search) params.set('search', query.search)
      if (query.status && query.status !== 'ALL') params.set('status', query.status)
      if (query.paymentStatus && query.paymentStatus !== 'ALL') params.set('paymentStatus', query.paymentStatus)
      if (query.shipmentStatus && query.shipmentStatus !== 'ALL') params.set('shipmentStatus', query.shipmentStatus)
      if (query.sortBy) params.set('sortBy', query.sortBy)
      if (query.sortDirection) params.set('sortDirection', query.sortDirection)
      return `admin/orders?${params.toString()}`
    },
    details: (id: string) => `admin/orders/${encodeURIComponent(id)}`,
  },
  payments: {
    list: (query: {
      pageNumber: number
      pageSize: number
      search?: string
      status?: string
      sortBy?: string
      sortDirection?: string
    }) => {
      const params = new URLSearchParams({
        pageNumber: String(query.pageNumber),
        pageSize: String(query.pageSize),
      })
      if (query.search) params.set('search', query.search)
      if (query.status && query.status !== 'ALL') params.set('status', query.status)
      if (query.sortBy) params.set('sortBy', query.sortBy)
      if (query.sortDirection) params.set('sortDirection', query.sortDirection)
      return `admin/payments?${params.toString()}`
    },
    details: (id: string) => `admin/payments/${encodeURIComponent(id)}`,
  },
  shipments: {
    list: (query: {
      pageNumber: number
      pageSize: number
      search?: string
      status?: string
      sortBy?: string
      sortDirection?: string
    }) => {
      const params = new URLSearchParams({
        pageNumber: String(query.pageNumber),
        pageSize: String(query.pageSize),
      })
      if (query.search) params.set('search', query.search)
      if (query.status && query.status !== 'ALL') params.set('status', query.status)
      if (query.sortBy) params.set('sortBy', query.sortBy)
      if (query.sortDirection) params.set('sortDirection', query.sortDirection)
      return `admin/shipments?${params.toString()}`
    },
    details: (id: string) => `admin/shipments/${encodeURIComponent(id)}`,
  },
  settings: {
    get: "admin/settings",
    update: "admin/settings",
  },
  logs: {
    getChunk: "admin/logs",
    getFiles: "admin/logs/files",
    clear: "admin/logs/clear",
    download: (date?: string) => `admin/logs/download${date ? `?date=${encodeURIComponent(date)}` : ""}`,
  },
  sales: {
    report: (params?: {
      startDate?: string;
      endDate?: string;
      status?: string;
      granularity?: string;
      refresh?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.set("startDate", params.startDate);
      if (params?.endDate) searchParams.set("endDate", params.endDate);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.granularity) searchParams.set("granularity", params.granularity);
      if (params?.refresh) searchParams.set("refresh", "true");
      const q = searchParams.toString();
      return `admin/sales/report${q ? `?${q}` : ""}`;
    },
    export: (params?: {
      startDate?: string;
      endDate?: string;
      status?: string;
      granularity?: string;
      refresh?: boolean;
      format?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.set("startDate", params.startDate);
      if (params?.endDate) searchParams.set("endDate", params.endDate);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.granularity) searchParams.set("granularity", params.granularity);
      if (params?.refresh) searchParams.set("refresh", "true");
      if (params?.format) searchParams.set("format", params.format);
      const q = searchParams.toString();
      return `admin/sales/export${q ? `?${q}` : ""}`;
    },
    clearCache: "admin/sales/clear-cache",
  },
  returns: {
    list: (query?: {
      status?: number | string;
      searchQuery?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    }) => {
      const params = new URLSearchParams();
      if (query?.status !== undefined && query.status !== "" && query.status !== "ALL") {
        params.set("status", String(query.status));
      }
      if (query?.searchQuery) params.set("searchQuery", query.searchQuery);
      if (query?.startDate) params.set("startDate", query.startDate);
      if (query?.endDate) params.set("endDate", query.endDate);
      if (query?.page) params.set("page", String(query.page));
      if (query?.pageSize) params.set("pageSize", String(query.pageSize));
      const q = params.toString();
      return `admin/returns${q ? `?${q}` : ""}`;
    },
    details: (returnId: string) => `admin/returns/${encodeURIComponent(returnId)}`,
    approve: (returnId: string) => `admin/returns/${encodeURIComponent(returnId)}/approve`,
    reject: (returnId: string) => `admin/returns/${encodeURIComponent(returnId)}/reject`,
    inspect: (returnId: string) => `admin/returns/${encodeURIComponent(returnId)}/inspect`,
    processRefund: (returnId: string) => `admin/returns/${encodeURIComponent(returnId)}/process-refund`,
  },
};

export const ApiPath = {
  admin: AdminApiPaths,
  customer: CustomerApiPaths,
  guest: { cart: { resolve: "guest/cart/resolve" } },
};
