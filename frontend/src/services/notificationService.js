import { ref } from "vue";
import api from "@/utils/apiInterceptor";

// State for notifications
const notifications = ref([]);
const unreadNotificationsCount = ref(0);
const lastFetchedTimestamp = ref(null);
const notificationsLoading = ref(false);
const showDevTools = ref(false);

// Update unread notifications count
const updateUnreadCount = () => {
  const unreadCount = notifications.value.filter((notification) => !notification.read).length;
  unreadNotificationsCount.value = unreadCount;

  // Update document title to show notification count
  if (unreadCount > 0) {
    document.title = `(${unreadCount}) ${document.title.replace(/^\(\d+\)\s*/, "")}`;
  } else {
    document.title = document.title.replace(/^\(\d+\)\s*/, "");
  }
};

// Fetch notifications from activity logs
const fetchNotifications = async (showToast = false, toast = null) => {
  try {
    notificationsLoading.value = true;

    // Get the lastFetchedTimestamp from localStorage if available
    if (!lastFetchedTimestamp.value) {
      lastFetchedTimestamp.value = localStorage.getItem("lastNotificationTimestamp") || null;
    }

    // Set timestamp untuk menghindari duplikasi notifikasi
    if (!localStorage.getItem("lastNotificationTimestamp")) {
      localStorage.setItem("lastNotificationTimestamp", new Date().toISOString());
    }

    // Use a query parameter to get only new logs since last check
    let url = "activity-logs";

    if (lastFetchedTimestamp.value) {
      url += `?since=${encodeURIComponent(lastFetchedTimestamp.value)}`;
    }

    const response = await api.get(url);

    // Handle different API response formats
    if (response.data) {
      let activityLogs = [];

      // Check for the expected structure
      if (response.data.status === "success" && response.data.data) {
        activityLogs = response.data.data;
      }
      // Alternative structure (status key directly in data with lowercase 'success')
      else if (response.data.status === "Success" && Array.isArray(response.data.data)) {
        activityLogs = response.data.data;
      }
      // If it's an array directly
      else if (Array.isArray(response.data)) {
        activityLogs = response.data;
      }

      // Jangan update timestamp dulu jika tidak ada activity logs
      if (activityLogs.length > 0) {
        // Update last fetched timestamp to current time
        const currentTimestamp = new Date().toISOString();
        lastFetchedTimestamp.value = currentTimestamp;
        localStorage.setItem("lastNotificationTimestamp", currentTimestamp);

        // Process the activity logs into notifications
        const newNotifications = activityLogs.map((log) => ({
          id: log.id || Date.now(),
          title: log.action_type || "System Update",
          message: log.description || "A system change has occurred",
          created_at: log.created_at || new Date().toISOString(),
          read: false,
          source: "activity_log",
          entity_id: log.id || Date.now(),
          entity_type: log.entity_type || "system",
          user_id: log.user_id || 1,
        }));

        // Add new notifications to the beginning of the list
        notifications.value = [...newNotifications, ...notifications.value];

        // Update unread count
        updateUnreadCount();

        // Show a toast notification if specified and we have new logs
        if (showToast && toast && newNotifications.length > 0) {
          toast.add({
            severity: "info",
            summary: "New Notifications",
            detail: `You have ${newNotifications.length} new notification${newNotifications.length > 1 ? "s" : ""}`,
            life: 3000,
          });
        }
      }
    }

    return true;
  } catch (error) {
    if (error.response) {
      // Silent error handling
    }
    return false;
  } finally {
    notificationsLoading.value = false;
  }
};

// Mark all notifications as read
const markAllAsRead = (toast = null) => {
  // Update semua notifikasi menjadi read=true
  notifications.value = notifications.value.map((notification) => ({
    ...notification,
    read: true,
  }));

  // Kosongkan jumlah notifikasi yang belum dibaca
  unreadNotificationsCount.value = 0;

  // Reset localStorage timestamp untuk mencegah notifikasi yang sama muncul kembali
  localStorage.setItem("lastNotificationTimestamp", new Date().toISOString());
  lastFetchedTimestamp.value = new Date().toISOString();

  // Update server jika API tersedia
  try {
    api
      .post("activity-logs/mark-read", { all: true })
      .then(() => {})
      .catch(() => {});
  } catch (e) {
    // Silent error handling
  }

  // Tampilkan toast konfirmasi
  if (toast) {
    toast.add({
      severity: "success",
      summary: "Notifications Cleared",
      detail: "All notifications have been marked as read",
      life: 3000,
    });
  }
};

// Mark a single notification as read
const markAsRead = (notificationId) => {
  const index = notifications.value.findIndex((n) => n.id === notificationId);
  if (index !== -1) {
    notifications.value[index].read = true;
    updateUnreadCount();

    // Update server to mark this notification as read
    api.post("activity-logs/mark-read", { id: notificationId }).catch(() => {});
  }
};

// Function to simulate new notifications for testing
const addTestNotification = (toast = null) => {
  const now = new Date();
  const testNotification = {
    id: Date.now(),
    title: "Test Notification",
    message: `This is a test notification created at ${now.toLocaleTimeString()}`,
    created_at: now.toISOString(),
    read: false,
    source: "test",
    entity_id: Date.now(),
    entity_type: "test",
    user_id: 1,
  };

  notifications.value = [testNotification, ...notifications.value];
  updateUnreadCount();

  if (toast) {
    toast.add({
      severity: "info",
      summary: "Test Notification",
      detail: "A test notification has been added",
      life: 3000,
    });
  }
};

// Clear all notifications (for testing)
const clearAllNotifications = (toast = null) => {
  notifications.value = [];
  updateUnreadCount();

  // Clear the last fetched timestamp to force a fresh fetch
  localStorage.removeItem("lastNotificationTimestamp");
  lastFetchedTimestamp.value = null;

  if (toast) {
    toast.add({
      severity: "info",
      summary: "Notifications Cleared",
      detail: "All notifications have been cleared",
      life: 3000,
    });
  }
};

// Manual refresh of notifications
const manualRefreshNotifications = async (toast = null) => {
  notificationsLoading.value = true;

  // Selalu tampilkan toast pada refresh manual
  const success = await fetchNotifications(true, toast);

  if (success) {
    if (toast) {
      toast.add({
        severity: "success",
        summary: "Refresh Complete",
        detail: unreadNotificationsCount.value > 0 ? `You have ${unreadNotificationsCount.value} unread notification${unreadNotificationsCount.value > 1 ? "s" : ""}` : "No new notifications",
        life: 3000,
      });
    }
  } else if (toast) {
    toast.add({
      severity: "error",
      summary: "Refresh Failed",
      detail: "Could not fetch notifications",
      life: 3000,
    });
  }
};

// Toggle development tools
const toggleDevTools = () => {
  showDevTools.value = !showDevTools.value;
};

export default {
  // State
  notifications,
  unreadNotificationsCount,
  lastFetchedTimestamp,
  notificationsLoading,
  showDevTools,

  // Methods
  fetchNotifications,
  markAllAsRead,
  markAsRead,
  addTestNotification,
  clearAllNotifications,
  manualRefreshNotifications,
  toggleDevTools,
};
