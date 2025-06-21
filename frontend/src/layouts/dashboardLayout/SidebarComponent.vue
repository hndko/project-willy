<template>
  <div class="h-full overflow-hidden transition-all duration-300 bg-white border-r border-gray-200" :class="{ 'w-64': sidebarVisible, 'w-0': !sidebarVisible }">
    <div class="flex flex-col h-full">
      <!-- Logo -->
      <div class="p-4 py-5 border-b">
        <div class="flex items-center">
          <img src="/images/test.svg" alt="Logo" class="justify-center mx-auto" />
        </div>
      </div>

      <!-- Sidebar Menu -->
      <div class="flex-grow overflow-y-auto custom-scrollbar">
        <!-- Custom Menu Implementation -->
        <div class="py-3">
          <div v-for="(item, index) in menuItems" :key="index" class="mb-0.5">
            <!-- Menu Item Without Submenu -->
            <router-link v-if="!item.items" :to="item.to" class="menu-item" :class="{ active: isRouteActive(item.to) }">
              <i :class="[item.icon, 'menu-icon']" :style="{ color: '#64748b' }"></i>
              <span>{{ item.label }}</span>
            </router-link>

            <!-- Menu Item With Submenu -->
            <div v-else>
              <Button @click="toggleSubmenu(index)" :class="{ 'bg-gray-100': isSubmenuActive(item) }" class="menu-submenu flex items-center justify-between w-full px-5 py-2.5 text-[15px] font-medium text-gray-700 border-none hover:bg-gray-50">
                <div class="flex items-center">
                  <i :class="[item.icon, 'menu-icon', 'mr-3', 'text-xl']" :style="{ color: '#64748b' }"></i>
                  <span>{{ item.label }}</span>
                </div>
                <i :class="['fi', expandedMenus[index] ? 'fi-rr-angle-down' : 'fi-rr-angle-right', 'text-xs', 'chevron-icon']"></i>
              </Button>

              <transition name="submenu">
                <div v-if="expandedMenus[index]" class="overflow-hidden transition-all duration-300 py-1 flex flex-col gap-1">
                  <router-link v-for="subItem in item.items" :key="subItem.label" :to="subItem.to" class="submenu-item flex items-center pl-12 pr-5 py-2 text-[15px] text-gray-600 hover:bg-gray-50" :class="{ 'active-submenu-item': isRouteActive(subItem.to) }">
                    <i :class="[subItem.icon, 'menu-icon', 'mr-3', 'text-lg']" :style="{ color: '#64748b' }"></i>
                    <span>{{ subItem.label }}</span>
                  </router-link>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <!-- User Profile in Sidebar -->
      <div class="p-4 mt-auto border-t">
        <div class="flex items-center">
          <router-link to="/profile" class="flex">
            <div class="w-12 h-12 mr-3 overflow-hidden bg-gray-100 rounded-full profile-avatar">
              <img v-if="profileData.profile_picture" :src="getProfileImageUrl(profileData.profile_picture)" alt="Profile" class="object-cover w-full h-full" />
              <i v-else class="flex items-center justify-center h-full text-xl text-gray-400 fi fi-rr-user"></i>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ getDisplayName() }}</p>
              <p class="text-sm text-gray-500">{{ getUserRole() }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import { useRoute } from "vue-router";
import Button from "primevue/button";

const props = defineProps({
  sidebarVisible: {
    type: Boolean,
    default: true,
  },
  menuItems: {
    type: Array,
    required: true,
  },
  expandedMenus: {
    type: Object,
    required: true,
  },
  profileData: {
    type: Object,
    required: true,
  },
  apiBaseUrl: {
    type: String,
    default: "http://localhost:8080",
  },
});

const emit = defineEmits(["update:expandedMenus"]);
const route = useRoute();

// Toggle submenu in sidebar
const toggleSubmenu = (index) => {
  const newExpandedMenus = { ...props.expandedMenus };
  newExpandedMenus[index] = !newExpandedMenus[index];
  emit("update:expandedMenus", newExpandedMenus);
};

// Check if route is active
const isRouteActive = (path) => {
  // Handle paths with query parameters
  if (path.includes("?")) {
    const [basePath] = path.split("?");
    const currentPath = route.path;

    // Handle action=new path
    if (path.includes("action=new")) {
      // Match only if both path and query parameter match
      return currentPath === basePath && route.query.action === "new";
    }

    // For paths without action=new, only match if there's no action query parameter
    return currentPath === basePath && !route.query.action;
  }

  // If this is a standard path, make sure it doesn't match routes with query parameters
  if (route.path === path && Object.keys(route.query).length > 0) {
    return false;
  }

  // Standard path check
  return route.path === path;
};

// Check if any submenu item is active
const isSubmenuActive = (item) => {
  if (!item.items) return false;

  // Check each submenu item to see if it's active using the same logic as isRouteActive
  return item.items.some((subItem) => {
    const path = subItem.to;

    if (path.includes("?")) {
      const [basePath] = path.split("?");
      const currentPath = route.path;

      if (path.includes("action=new")) {
        return currentPath === basePath && route.query.action === "new";
      }

      return currentPath === basePath && !route.query.action;
    }

    return route.path === path && Object.keys(route.query).length === 0;
  });
};

// Helper to get display name (with fallbacks)
const getDisplayName = () => {
  return props.profileData.full_name || (props.profileData.user && props.profileData.user.name) || "User";
};

// Helper to get user role (with fallbacks)
const getUserRole = () => {
  if (props.profileData.user && props.profileData.user.is_active) {
    return "Active User";
  }
  return "User";
};

// Helper to get profile image URL
const getProfileImageUrl = (profilePicture) => {
  if (!profilePicture) return "";

  // Check if it's already a full URL
  if (profilePicture.startsWith("http")) {
    return profilePicture;
  }

  // Otherwise construct the URL
  return `${props.apiBaseUrl}/uploads/${profilePicture}`;
};
</script>

<style scoped>
/* Custom styling untuk semua menu item */
.menu-item {
  display: flex;
  align-items: center;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background-color: #f9fafb;
  border-left-color: #e5e7eb;
  transform: translateX(2px);
}

.menu-item.active {
  background-color: rgba(243, 244, 246, 0.7);
  border-left-color: #3b82f6;
}

.menu-item.active i {
  transform: scale(1.1);
}

.menu-item i {
  margin-right: 0.75rem;
  font-size: 1.25rem;
  transition: all 0.2s ease;
  color: #64748b;
}

.menu-submenu {
  background-color: transparent !important;
  border: none !important;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.menu-submenu:hover {
  border-left-color: #e5e7eb;
}

/* Make active submenu headers visually distinct */
.menu-submenu.bg-gray-100 {
  border-left-color: #3b82f6;
}

/* Animasi untuk ikon */
i.menu-icon {
  transition: all 0.2s ease;
}

i.menu-icon:hover,
.active i.menu-icon {
  transform: scale(1.15);
}

/* Animasi untuk dropdown chevron */
.chevron-icon {
  transition: transform 0.3s ease;
}

.chevron-open {
  transform: rotate(90deg);
}

/* Custom styling for submenu */
.submenu-item {
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin-top: 1px;
  margin-bottom: 1px;
  position: relative;
}

.submenu-item:hover {
  padding-left: 3.5rem;
  border-left-color: #e5e7eb;
  background-color: #f9fafb;
}

.submenu-item.bg-gray-100 {
  border-left-color: #3b82f6;
  background-color: rgba(243, 244, 246, 0.7) !important;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #a8a8a8;
}

/* Animasi untuk menu expand/collapse */
.submenu-enter-active,
.submenu-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  max-height: 500px;
  overflow: hidden;
  opacity: 1;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Active submenu item styling */
.active-submenu-item {
  background-color: #f3f4f6 !important;
  border-left-color: #3b82f6 !important;
  font-weight: 500;
  color: #1f2937 !important;
  margin-top: 2px !important;
  margin-bottom: 2px !important;
  position: relative;
  z-index: 2;
}

.active-submenu-item::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e7eb;
  z-index: 1;
}

.active-submenu-item::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e7eb;
  z-index: 1;
}

.active-submenu-item i {
  color: #3b82f6 !important;
  transform: scale(1.1);
}
</style>
