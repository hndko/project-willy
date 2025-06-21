<template>
  <div class="relative">
    <Button @click="$emit('toggle-profile-menu')" class="flex items-center p-button-text p-button-rounded profile-menu-button" aria-haspopup="true" aria-controls="profile-menu">
      <div class="w-8 h-8 mr-2 overflow-hidden bg-gray-100 rounded-full">
        <img v-if="profileData.profile_picture" :src="getProfileImageUrl(profileData.profile_picture)" alt="Profile" class="object-cover w-full h-full" />
        <i v-else class="flex items-center justify-center h-full text-gray-400 fi fi-rr-user"></i>
      </div>
      <span class="mr-2">{{ getDisplayName() }}</span>
      <i class="transition-transform duration-300 fi fi-rr-angle-down" :class="{ 'rotate-180': profileMenuVisible }"></i>
    </Button>

    <transition
      name="profile-dropdown"
      enter-active-class="transition duration-200 ease-out transform"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in transform"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <div v-if="profileMenuVisible" id="profile-menu" class="absolute right-0 z-50 w-56 mt-2 bg-white rounded-md shadow-lg profile-dropdown-menu">
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center">
            <div class="w-12 h-12 mr-3 overflow-hidden bg-gray-100 rounded-full profile-avatar-large">
              <img v-if="profileData.profile_picture" :src="getProfileImageUrl(profileData.profile_picture)" alt="Profile" class="object-cover w-full h-full" />
              <i v-else class="flex items-center justify-center h-full text-xl text-gray-400 fi fi-rr-user"></i>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ getDisplayName() }}</p>
              <p class="text-sm text-gray-500">{{ getUserRole() }}</p>
            </div>
          </div>
        </div>
        <div class="py-1">
          <router-link to="/profile" class="flex items-center px-4 py-2 text-sm text-gray-700 dropdown-menu-item" :class="{ 'active-dropdown-item': isRouteActive('/profile') }">
            <i class="mr-2 text-gray-500 fi fi-rr-user"></i> Profile
            <span v-if="isRouteActive('/profile')" class="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          </router-link>
          <router-link to="/settings" class="flex items-center px-4 py-2 text-sm text-gray-700 dropdown-menu-item" :class="{ 'active-dropdown-item': isRouteActive('/settings') }">
            <i class="mr-2 text-gray-500 fi fi-rr-settings"></i> Settings
            <span v-if="isRouteActive('/settings')" class="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          </router-link>
        </div>
        <div class="py-1 border-t border-gray-100">
          <button @click="$emit('logout')" class="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 cursor-pointer dropdown-menu-item"><i class="mr-2 text-red-500 fi fi-rr-sign-out-alt"></i> Logout</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import { useRoute } from "vue-router";
import Button from "primevue/button";

const props = defineProps({
  profileData: {
    type: Object,
    required: true,
  },
  profileMenuVisible: {
    type: Boolean,
    default: false,
  },
  apiBaseUrl: {
    type: String,
    default: "http://localhost:8080",
  },
});

defineEmits(["toggle-profile-menu", "logout"]);

const route = useRoute();

// Function to get profile image URL
const getProfileImageUrl = (profilePicture) => {
  if (!profilePicture) return "";

  // Check if it's already a full URL
  if (profilePicture.startsWith("http")) {
    return profilePicture;
  }

  // Otherwise construct the URL
  return `${props.apiBaseUrl}/uploads/${profilePicture}`;
};

// Check if route is active
const isRouteActive = (path) => {
  return route.path === path;
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
</script>

<style scoped>
/* Custom styling for profile dropdown menu */
.profile-menu-button {
  position: relative;
  transition: all 0.2s ease;
}

.profile-menu-button:hover {
  background-color: rgba(243, 244, 246, 0.7) !important;
  transform: translateY(-1px);
}

.profile-dropdown-menu {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(229, 231, 235, 0.8);
}

.dropdown-menu-item {
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
}

.dropdown-menu-item:hover {
  background-color: rgba(243, 244, 246, 0.7);
  padding-left: 1.25rem;
}

.dropdown-menu-item.active-dropdown-item {
  background-color: rgba(239, 246, 255, 0.7);
  font-weight: 500;
  color: #3b82f6;
}

.dropdown-menu-item.active-dropdown-item i {
  color: #3b82f6;
}

.profile-avatar-large {
  transition: all 0.2s ease;
}

.profile-avatar-large:hover {
  transform: scale(1.05);
}
</style>
