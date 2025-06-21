<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <SidebarComponent :sidebar-visible="sidebarVisible" :menu-items="menuItems" :expanded-menus="expandedMenus" @update:expanded-menus="expandedMenus = $event" :profile-data="profileData" :api-base-url="apiBaseUrl" />

    <!-- Main Content -->
    <div class="flex flex-col flex-1 overflow-hidden transition-all duration-300">
      <!-- Header -->
      <HeaderComponent
        :page-title="pageTitle"
        :profile-data="profileData"
        :notifications="notifications"
        :notifications-menu-visible="notificationsMenuVisible"
        :profile-menu-visible="profileMenuVisible"
        :unread-notifications-count="unreadNotificationsCount"
        :notifications-loading="notificationsLoading"
        :show-dev-tools="showDevTools"
        :api-base-url="apiBaseUrl"
        @toggle-sidebar="toggleSidebar"
        @toggle-notifications-menu="toggleNotificationsMenu"
        @toggle-profile-menu="toggleProfileMenu"
        @refresh-notifications="refreshNotifications"
        @mark-all-as-read="markAllAsRead"
        @handle-notification-click="handleNotificationClick"
        @go-to-activity-logs="goToActivityLogs"
        @logout="logout"
        @add-test-notification="addTestNotification"
        @clear-all-notifications="clearAllNotifications"
      />

      <!-- Main content area -->
      <main class="flex-1 p-6 overflow-auto bg-gray-100">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, inject, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "primevue/usetoast";
import api from "@/utils/apiInterceptor"; // Import the API service with interceptors
import SidebarComponent from "./SidebarComponent.vue";
import HeaderComponent from "./HeaderComponent.vue";
import NotificationService from "@/services/notificationService";

// Import Uicons CSS
const linkElement = document.createElement("link");
linkElement.rel = "stylesheet";
linkElement.href = "https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css";
document.head.appendChild(linkElement);

const props = defineProps({
  pageTitle: {
    type: String,
    default: "Dashboard",
  },
});

// API Base URL for images and other resources
const apiBaseUrl = computed(() => {
  return "http://localhost:8080";
});

// Try to inject profile updates from the profile page
const profileUpdate = inject("profileUpdate", { imageChanged: false, imagePath: null });

// Toast for notifications
const toast = useToast();

// Profile data from API - structured to match backend entity
const profileData = ref({
  id: null,
  user_id: null,
  full_name: "",
  email: "",
  phone_number: "",
  profile_picture: "",
  is_complete: false,
  user: {
    username: "",
    email: "",
    name: "",
    phone: "",
    is_active: false,
    lastLogin: null,
  },
});

// Access notification service state
const { notifications, unreadNotificationsCount, notificationsLoading, fetchNotifications, markAllAsRead: markAllNotificationsAsRead, markAsRead, addTestNotification, clearAllNotifications, manualRefreshNotifications, showDevTools, toggleDevTools } = NotificationService;

const router = useRouter();
const route = useRoute();
const sidebarVisible = ref(true);
const profileMenuVisible = ref(false);
const notificationsMenuVisible = ref(false);
const expandedMenus = ref({});
const loading = ref(false);

// Store the keyboard handler reference to remove it later
const keyboardHandlerRef = ref(null);

// Watch for profile image updates with proper reactivity
watch(
  profileUpdate,
  (newVal) => {
    if (newVal && newVal.imageChanged && newVal.imagePath) {
      profileData.value.profile_picture = newVal.imagePath;
    }
  },
  { deep: true }
);

// Fetch user profile data
const fetchProfileData = async () => {
  loading.value = true;
  try {
    // Use the API service which already handles tokens
    const response = await api.get("/profile");

    if (response.data && response.data.status === "success" && response.data.data) {
      profileData.value = response.data.data;
    }
  } catch (error) {
    // Only show toast if it's not an auth error (which is handled by API interceptor)
    if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Gagal memuat data profil",
        life: 3000,
      });
    }
  } finally {
    loading.value = false;
  }
};

// Toggle sidebar visibility
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

// Toggle profile menu
const toggleProfileMenu = () => {
  profileMenuVisible.value = !profileMenuVisible.value;
  if (profileMenuVisible.value) {
    notificationsMenuVisible.value = false;
  }
};

// Toggle notifications menu
const toggleNotificationsMenu = () => {
  notificationsMenuVisible.value = !notificationsMenuVisible.value;
  if (notificationsMenuVisible.value) {
    profileMenuVisible.value = false;
    fetchNotifications(false, toast);
  }
};

// Refresh notifications
const refreshNotifications = () => {
  manualRefreshNotifications(toast);
};

// Mark all as read wrapper
const markAllAsRead = () => {
  markAllNotificationsAsRead(toast);
};

// Navigate to activity logs page
const goToActivityLogs = () => {
  notificationsMenuVisible.value = false;
  router.push("/activity-logs");
};

// Handle notification click
const handleNotificationClick = (notification) => {
  // Mark the notification as read
  if (!notification.read) {
    markAsRead(notification.id);
  }

  // Navigate to related entity based on notification type
  notificationsMenuVisible.value = false;

  // Navigate to activity log detail or relevant page
  // For now, we'll just navigate to activity logs
  router.push("/activity-logs");
};

const logout = () => {
  profileMenuVisible.value = false;

  // Clear authentication data
  localStorage.removeItem("token");

  // Redirect to login page
  router.push("/auth/login");
};

// Menu items with updated Uicons
const menuItems = ref([
  {
    label: "Dashboard",
    icon: "fi fi-rr-apps",
    to: "/dashboard",
  },
  {
    label: "Sales",
    icon: "fi fi-rr-shopping-cart",
    items: [
      {
        label: "Sales List",
        icon: "fi fi-rr-list",
        to: "/sales",
      },
      {
        label: "New Sale",
        icon: "fi fi-rr-plus",
        to: "/sales?action=new",
      },
      {
        label: "Invoice List",
        icon: "fi fi-rr-receipt",
        to: "/invoices",
      },
      {
        label: "Deliveries",
        icon: "fi fi-rr-truck-side",
        to: "/deliveries",
      },
    ],
  },
  {
    label: "Purchases",
    icon: "fi fi-rr-shopping-bag",
    items: [
      {
        label: "Purchases Raw Material",
        icon: "fi fi-rr-list",
        to: "/purchases",
      },
    ],
  },
  {
    label: "Products",
    icon: "fi fi-rr-box",
    items: [
      {
        label: "Products List",
        icon: "fi fi-rr-list",
        to: "/products",
      },
      {
        label: "Add Product",
        icon: "fi fi-rr-plus",
        to: "/products?action=new",
      },
      {
        label: "Categories",
        icon: "fi fi-rr-tags",
        to: "/products/categories",
      },
    ],
  },
  {
    label: "Raw Material",
    icon: "fi fi-rr-layers",
    items: [
      {
        label: "Raw Material List",
        icon: "fi fi-rr-list",
        to: "/raw-materials",
      },
      {
        label: "Add Raw Material",
        icon: "fi fi-rr-plus",
        to: "/raw-materials?action=new",
      },
      {
        label: "Raw Material Usage",
        icon: "fi fi-rr-list-check",
        to: "/raw-material-usages",
      },
      {
        label: "Suppliers",
        icon: "fi fi-rr-truck-loading",
        to: "/products/suppliers",
      },
    ],
  },
  {
    label: "Stock",
    icon: "fi fi-rr-database",
    items: [
      {
        label: "Stock List",
        icon: "fi fi-rr-list",
        to: "/stocks",
      },
      {
        label: "Add Stock",
        icon: "fi fi-rr-plus",
        to: "/stocks?action=new",
      },
    ],
  },
  {
    label: "Production",
    icon: "fi fi-rr-plus",
    items: [
      {
        label: "Production List",
        icon: "fi fi-rr-list",
        to: "/productions",
      },
      {
        label: "BoM Management",
        icon: "fi fi-rr-list-check",
        to: "/productions/boms",
      },
    ],
  },
  {
    label: "Customers",
    icon: "fi fi-rr-user-add",
    items: [
      {
        label: "Customers List",
        icon: "fi fi-rr-list",
        to: "/customers",
      },
      {
        label: "Add Customer",
        icon: "fi fi-rr-plus",
        to: "/customers?action=new",
      },
    ],
  },
  {
    label: "Operational Costs",
    icon: "fi fi-rr-money-check",
    to: "/operational-costs",
  },
  {
    label: "Users",
    icon: "fi fi-rr-users-alt",
    to: "/users",
  },
  {
    label: "Reports",
    icon: "fi fi-rr-chart-pie-alt",
    to: "/reports",
  },
  {
    label: "Settings",
    icon: "fi fi-rr-settings",
    to: "/settings",
  },
  {
    label: "Activity Logs",
    icon: "fi fi-rr-time-past",
    to: "/activity-logs",
  },
]);

onMounted(() => {
  // Setup click outside handler for dropdowns
  const handleClickOutside = (event) => {
    const profileButton = document.querySelector('[aria-controls="profile-menu"]');
    const profileMenu = document.getElementById("profile-menu");
    const notificationButton = document.querySelector('[aria-controls="notifications-menu"]');
    const notificationMenu = document.getElementById("notifications-menu");

    if (profileMenuVisible.value && profileButton && !profileButton.contains(event.target) && profileMenu && !profileMenu.contains(event.target)) {
      profileMenuVisible.value = false;
    }

    if (notificationsMenuVisible.value && notificationButton && !notificationButton.contains(event.target) && notificationMenu && !notificationMenu.contains(event.target)) {
      notificationsMenuVisible.value = false;
    }
  };
  document.addEventListener("click", handleClickOutside);

  // Expand menu if current route is in a submenu
  menuItems.value.forEach((item, index) => {
    if (item.items) {
      const isActive = item.items.some((subItem) => {
        const path = subItem.to;

        if (path.includes("?")) {
          const [basePath] = path.split("?");

          if (path.includes("action=new")) {
            return route.path === basePath && route.query.action === "new";
          }

          return route.path === basePath && !route.query.action;
        }

        return route.path === path;
      });

      if (isActive) {
        expandedMenus.value[index] = true;
      }
    }
  });

  // Fetch profile data when component mounts
  fetchProfileData();

  // Initialize notifications with a single fetch
  fetchNotifications(false, toast).catch(() => {});

  // Add keyboard shortcut for testing
  const handleKeydown = (e) => {
    // Ctrl+Shift+N
    if (e.ctrlKey && e.shiftKey && e.key === "N") {
      addTestNotification(toast);
    }

    // Ctrl+Shift+D to toggle dev tools
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
      toggleDevTools();
    }

    // Ctrl+Shift+R to refresh notifications manually
    if (e.ctrlKey && e.shiftKey && e.key === "R") {
      refreshNotifications();
    }
  };

  keyboardHandlerRef.value = handleKeydown;
  document.addEventListener("keydown", handleKeydown);

  // Cleanup function for event listeners
  onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);

    if (keyboardHandlerRef.value) {
      document.removeEventListener("keydown", keyboardHandlerRef.value);
    }
  });
});
</script>
