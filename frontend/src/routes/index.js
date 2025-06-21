import { createRouter, createWebHistory } from "vue-router";

// Route definitions with lazy loading
const routes = [
  // Default redirect
  {
    path: "/",
    redirect: "/auth/login",
  },

  // Authentication routes
  {
    path: "/auth",
    children: [
      {
        path: "login",
        component: () => import("@/views/auth/Login.vue"),
      },
      {
        path: "register",
        component: () => import("@/views/auth/Register.vue"),
      },
    ],
  },

  // Legacy routes - redirect to new structure
  { path: "/login", redirect: "/auth/login" },
  { path: "/register", redirect: "/auth/register" },

  // Dashboard
  {
    path: "/dashboard",
    component: () => import("@/views/dashboard/Dashboard.vue"),
    meta: { requiresAuth: true },
  },

  // User management
  {
    path: "/users",
    component: () => import("@/views/users/Users.vue"),
    meta: { requiresAuth: true },
  },

  // Profile
  {
    path: "/profile",
    component: () => import("@/views/profile/Profile.vue"),
    meta: { requiresAuth: true },
  },

  // Product management
  {
    path: "/products",
    children: [
      {
        path: "",
        component: () => import("@/views/products/Products.vue"),
      },
    ],
    meta: { requiresAuth: true },
  },

  // Suppliers management
  {
    path: "/products/suppliers",
    component: () => import("@/views/suppliers/Suppliers.vue"),
    meta: { requiresAuth: true },
  },

  // Customers management
  {
    path: "/customers",
    component: () => import("@/views/customers/Customers.vue"),
    meta: { requiresAuth: true },
  },

  // Categories management
  {
    path: "/products/categories",
    component: () => import("@/views/categories/Categories.vue"),
    meta: { requiresAuth: true },
  },

  // Legacy stock route - redirects to the new location
  {
    path: "/products/stock",
    redirect: "/stocks",
  },

  // Stock management (new location)
  {
    path: "/stocks",
    component: () => import("@/views/stocks/Stocks.vue"),
    meta: { requiresAuth: true },
  },

  // Raw Materials management
  {
    path: "/raw-materials",
    component: () => import("@/views/rawmaterials/RawMaterials.vue"),
    meta: { requiresAuth: true },
  },

  // Raw Material Usage management
  {
    path: "/raw-material-usages",
    component: () => import("@/views/usages/Usages.vue"),
    meta: { requiresAuth: true },
  },

  // Sales
  {
    path: "/sales",
    component: () => import("@/views/sales/Sales.vue"),
    meta: { requiresAuth: true },
  },

  // Invoices
  {
    path: "/invoices",
    children: [
      {
        path: "",
        component: () => import("@/views/invoices/Invoices.vue"),
      },
      {
        path: ":id",
        component: () => import("@/views/invoices/InvoiceDetail.vue"),
      },
    ],
    meta: { requiresAuth: true },
  },

  // Deliveries
  {
    path: "/deliveries",
    component: () => import("@/views/deliveries/Deliveries.vue"),
    meta: { requiresAuth: true },
  },

  // Reports
  {
    path: "/reports",
    children: [
      {
        path: "",
        component: () => import("@/views/reports/Reports.vue"),
      },
      {
        path: "stock",
        component: () => import("@/views/reports/StockReport.vue"),
      },
    ],
    meta: { requiresAuth: true },
  },

  // Operational Costs
  {
    path: "/operational-costs",
    component: () => import("@/views/operationalCost/OperationalCost.vue"),
    meta: { requiresAuth: true },
  },

  // Purchases
  {
    path: "/purchases",
    component: () => import("@/views/purchases/Purchases.vue"),
    meta: { requiresAuth: true },
  },

  // Settings
  {
    path: "/settings",
    component: () => import("@/views/settings/Settings.vue"),
    meta: { requiresAuth: true },
  },

  // Activity Logs
  {
    path: "/activity-logs",
    component: () => import("@/views/activitylogs/ActivityLogs.vue"),
    meta: { requiresAuth: true },
  },

  // Productions
  {
    path: "/productions",
    name: "Productions",
    component: () => import("@/views/productions/Productions.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/productions/boms",
    name: "BoMs",
    component: () => import("@/views/productions/BoMs.vue"),
    meta: { requiresAuth: true },
  },

  // Catch-all route - redirect to dashboard if authenticated, otherwise to login
  {
    path: "/:pathMatch(.*)*",
    redirect: (to) => {
      const token = localStorage.getItem("token");
      return token ? "/dashboard" : "/auth/login";
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const token = localStorage.getItem("token");

  if (requiresAuth && !token) {
    // Redirect to login if trying to access a protected route without authentication
    next("/auth/login");
  } else {
    // Proceed normally
    next();
  }
});

export default router;
