<template>
  <div class="relative">
    <Button @click="$emit('toggle-notifications-menu')" icon="fi fi-rr-bell" class="mr-4 p-button-text p-button-rounded notification-button" aria-haspopup="true" aria-controls="notifications-menu">
      <!-- Badge to show unread notifications -->
      <span v-if="unreadNotificationsCount > 0" class="notification-dot"></span>
    </Button>

    <transition
      name="notification-dropdown"
      enter-active-class="transition duration-200 ease-out transform"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in transform"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <div v-if="notificationsMenuVisible" id="notifications-menu" class="absolute right-0 z-50 mt-2 bg-white rounded-md shadow-lg w-80 notifications-dropdown">
        <div class="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 class="font-medium text-gray-900">Notifications</h3>
          <div class="flex items-center gap-2">
            <Button v-if="unreadNotificationsCount > 0" @click="$emit('mark-all-as-read')" label="Mark all as read" class="p-button-text p-button-sm" />
            <Button @click="$emit('refresh-notifications')" icon="fi fi-rr-refresh" :loading="notificationsLoading" class="p-button-text p-button-rounded p-button-sm" tooltipOptions="Refresh" />
            <Button @click="$emit('go-to-activity-logs')" icon="fi fi-rr-list" class="p-button-text p-button-rounded p-button-sm" tooltipOptions="View All" />
          </div>
        </div>
        <div class="overflow-y-auto max-h-80 custom-scrollbar">
          <div v-if="notifications.length === 0" class="p-8 text-center">
            <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
              <i class="text-xl text-gray-400 fi fi-rr-bell-ring"></i>
            </div>
            <h3 class="mb-1 text-lg font-medium text-gray-900">No notifications yet</h3>
            <p class="mb-4 text-sm text-gray-500">We'll notify you when there's new activity</p>
            <Button @click="$emit('refresh-notifications')" label="Refresh" icon="fi fi-rr-refresh" class="p-button-outlined p-button-sm" :loading="notificationsLoading" />
          </div>
          <div v-else>
            <div v-for="(notification, index) in notifications" :key="index" class="p-3 border-b border-gray-100 last:border-b-0 notification-item" :class="{ 'bg-blue-50': !notification.read }" @click="$emit('handle-notification-click', notification)">
              <div class="flex items-start">
                <div class="flex-shrink-0 mr-3">
                  <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <i class="text-blue-500 fi fi-rr-bell-ring"></i>
                  </div>
                </div>
                <div class="flex-grow">
                  <div class="flex justify-between mb-1">
                    <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                    <span class="text-xs text-gray-500">{{ formatNotificationTime(notification.created_at) }}</span>
                  </div>
                  <p class="text-sm text-gray-600">{{ notification.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="p-3 text-center border-t border-gray-100">
          <router-link to="/activity-logs" @click="$emit('toggle-notifications-menu', false)" class="text-sm text-blue-600 transition-colors hover:text-blue-800"> View all notifications </router-link>
        </div>

        <!-- Development Tools (only shown in development mode) -->
        <div v-if="showDevTools" class="p-3 border-t border-gray-100 bg-gray-50">
          <div class="mb-2 text-xs text-center text-gray-500">Development Tools</div>
          <div class="flex items-center justify-center gap-2">
            <Button @click="$emit('add-test-notification')" label="Add Test Notification" class="p-button-sm p-button-secondary" />
            <Button @click="$emit('clear-all-notifications')" label="Clear All" class="p-button-sm p-button-danger p-button-text" />
          </div>
          <div class="mt-2 text-center">
            <code class="p-1 text-xs bg-gray-100 rounded">Ctrl+Shift+N</code>
            <span class="ml-1 text-xs text-gray-500">to create a test notification</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import Button from "primevue/button";

const props = defineProps({
  notifications: {
    type: Array,
    required: true,
  },
  notificationsMenuVisible: {
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
});

defineEmits(["toggle-notifications-menu", "mark-all-as-read", "refresh-notifications", "handle-notification-click", "go-to-activity-logs", "add-test-notification", "clear-all-notifications"]);

// Format notification time (relative time)
const formatNotificationTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  }
};
</script>

<style scoped>
/* Custom styling for notification dropdown */
.notification-button {
  position: relative;
  transition: all 0.2s ease;
}

.notification-button:hover {
  background-color: rgba(243, 244, 246, 0.7) !important;
  transform: translateY(-1px);
}

/* Notification dot styling */
.notification-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background-color: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #ffffff;
  animation: pulse 2s infinite;
}

.notifications-dropdown {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(229, 231, 235, 0.8);
}

.notification-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.notification-item:hover {
  background-color: rgba(243, 244, 246, 0.7);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(220, 38, 38, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
  }
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
</style>
