<template>
  <header class="flex items-center justify-between w-full px-6 py-3 bg-white shadow-lg">
    <div class="flex items-center">
      <Button @click="toggleSidebar" icon="fi fi-rr-menu-burger" class="p-button-text p-button-rounded" />
      <h1 class="ml-4 text-xl font-semibold">{{ pageTitle }}</h1>
    </div>
    <div class="flex items-center">
      <!-- Notification Component -->
      <NotificationDropdown
        :notifications="notifications"
        :notifications-menu-visible="notificationsMenuVisible"
        :unread-notifications-count="unreadNotificationsCount"
        :notifications-loading="notificationsLoading"
        :show-dev-tools="showDevTools"
        :api-base-url="apiBaseUrl"
        @toggle-notifications-menu="toggleNotificationsMenu"
        @mark-all-as-read="markAllAsRead"
        @refresh-notifications="$emit('refresh-notifications')"
        @handle-notification-click="$emit('handle-notification-click', $event)"
        @go-to-activity-logs="$emit('go-to-activity-logs')"
        @add-test-notification="$emit('add-test-notification')"
        @clear-all-notifications="$emit('clear-all-notifications')"
      />

      <!-- Profile Dropdown -->
      <ProfileDropdown :profile-data="profileData" :profile-menu-visible="profileMenuVisible" :api-base-url="apiBaseUrl" @toggle-profile-menu="toggleProfileMenu" @logout="$emit('logout')" />
    </div>
  </header>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import Button from "primevue/button";
import NotificationDropdown from "./NotificationDropdown.vue";
import ProfileDropdown from "./ProfileDropdown.vue";

const props = defineProps({
  pageTitle: {
    type: String,
    required: true,
  },
  profileData: {
    type: Object,
    required: true,
  },
  notifications: {
    type: Array,
    required: true,
  },
  notificationsMenuVisible: {
    type: Boolean,
    default: false,
  },
  profileMenuVisible: {
    type: Boolean,
    default: false,
  },
  unreadNotificationsCount: {
    type: Number,
    default: 0,
  },
  notificationsLoading: {
    type: Boolean,
    default: false,
  },
  showDevTools: {
    type: Boolean,
    default: false,
  },
  apiBaseUrl: {
    type: String,
    default: "http://localhost:8080",
  },
});

const emit = defineEmits(["toggle-sidebar", "toggle-notifications-menu", "toggle-profile-menu", "refresh-notifications", "mark-all-as-read", "handle-notification-click", "go-to-activity-logs", "logout", "add-test-notification", "clear-all-notifications"]);

const toggleSidebar = () => {
  emit("toggle-sidebar");
};

const toggleNotificationsMenu = () => {
  emit("toggle-notifications-menu");
};

const toggleProfileMenu = () => {
  emit("toggle-profile-menu");
};

const markAllAsRead = () => {
  emit("mark-all-as-read");
};
</script>
