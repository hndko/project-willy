<template>
  <DashboardLayout pageTitle="Activity Logs">
    <div class="grid grid-cols-1 gap-4">
      <!-- Activity Log Table Card -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold">System Activity Logs</span>
              <Tag v-if="tabMenuActiveIndex === 0" severity="info" value="All Logs" />
              <Tag v-else-if="tabMenuActiveIndex === 1" severity="success" value="Create Events" />
              <Tag v-else-if="tabMenuActiveIndex === 2" severity="info" value="Update Events" />
              <Tag v-else-if="tabMenuActiveIndex === 3" severity="danger" value="Delete Events" />
              <Tag v-if="selectedMonth" severity="primary" :value="formatMonthDisplay(selectedMonth)" />
            </div>
          </div>
        </template>
        <template #content>
          <!-- Tab Navigation for filtering by action type -->
          <div class="mb-4 custom-tabs">
            <div class="tab-container">
              <div v-for="(item, index) in tabMenuItems" :key="index" class="tab-item" :class="{ active: tabMenuActiveIndex === index }" @click="setActiveTab(index)">
                <i :class="['tab-icon', item.icon]"></i>
                <span class="tab-label">{{ item.label }}</span>
              </div>
            </div>
          </div>

          <ActivityLogTable :refresh="refreshTable" :active-tab="tabMenuActiveIndex" @view="viewLogDetails" @refresh="handleTableRefresh" @month-change="handleMonthChange" ref="logTableRef" />
        </template>
      </Card>

      <!-- Real-time Activity Timeline -->
      <Card class="mt-4 shadow-sm">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-lg font-semibold">Recent Activity Timeline</span>
            <div class="flex items-center gap-2">
              <Button icon="pi pi-filter" :class="{ 'p-button-outlined p-button-info': !!timelineMonthFilter }" text rounded @click="toggleTimelineFilterDialog" />
              <Button icon="pi pi-sync" text rounded @click="loadTimelineData" :loading="timelineLoading" />
            </div>
          </div>
        </template>
        <template #content>
          <div v-if="timelineLoading" class="flex justify-center py-4">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="5" />
          </div>
          <div v-else>
            <Timeline :value="timelineEvents" class="customized-timeline">
              <template #marker="slotProps">
                <span :class="getTimelineIconClass(slotProps.item.action)">
                  <i :class="getTimelineIcon(slotProps.item.action)"></i>
                </span>
              </template>
              <template #content="slotProps">
                <div :class="getActionRowClass(slotProps.item.action)" class="p-4 mb-4 rounded-lg shadow-sm timeline-event-content">
                  <div class="flex items-start">
                    <div class="flex-grow">
                      <p class="m-0 font-medium">{{ slotProps.item.title }}</p>
                      <p class="mt-1 text-sm text-gray-600">{{ slotProps.item.description }}</p>
                      <div class="flex items-center gap-2 mt-2">
                        <Tag :value="slotProps.item.action" :severity="getActionSeverity(slotProps.item.action)" />
                        <Badge :value="slotProps.item.table" class="text-xs" />
                        <span class="text-xs text-gray-500">{{ slotProps.item.time }}</span>
                      </div>
                    </div>
                    <Button icon="pi pi-eye" text rounded severity="secondary" @click="viewLogDetails(slotProps.item.raw)" class="ml-2" />
                  </div>
                </div>
              </template>
            </Timeline>

            <div v-if="timelineEvents.length === 0" class="py-4 text-center text-gray-500">No recent activity to display</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Log Details Dialog -->
    <Dialog v-model:visible="detailsDialogVisible" header="Activity Log Details" :style="{ width: '700px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <ActivityLogDetails v-if="detailsDialogVisible" :id="selectedLogId" @close="closeDetailsDialog" />
    </Dialog>

    <!-- Timeline Filter Dialog -->
    <Dialog v-model:visible="timelineFilterDialogVisible" header="Filter Timeline" :style="{ width: '450px' }" :modal="true">
      <div class="p-4">
        <h3 class="mb-2 font-medium text-gray-700">Filter by Month</h3>
        <Calendar v-model="timelineMonthFilter" view="month" dateFormat="mm/yy" placeholder="Select month" class="w-full" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Clear Filter" @click="clearTimelineFilter" outlined />
          <Button label="Apply" @click="applyTimelineFilter" />
        </div>
      </template>
    </Dialog>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Dialog from "primevue/dialog";
import Timeline from "primevue/timeline";
import ProgressSpinner from "primevue/progressspinner";
import Calendar from "primevue/calendar";
import ActivityLogTable from "@/components/activitylogs/ActivityLogTable.vue";
import ActivityLogDetails from "@/components/activitylogs/ActivityLogDetails.vue";
import { getActivityLogs } from "@/services/activityLogService";
import { format, formatDistanceToNow, startOfMonth, endOfMonth } from "date-fns";
import { getActionSeverity, getActionRowClass, getTimelineIconClass } from "@/utils/actionUtils";
import { showSuccess, showApiError } from "@/utils/toast";

// Tab menu setup for filtering logs by action type
const tabMenuActiveIndex = ref(0);
const tabMenuItems = ref([
  { label: "All Logs", icon: "pi pi-list" },
  { label: "Create Events", icon: "pi pi-plus-circle" },
  { label: "Update Events", icon: "pi pi-pencil" },
  { label: "Delete Events", icon: "pi pi-trash" },
]);

// For month filtering
const selectedMonth = ref(null);
const timelineMonthFilter = ref(null);
const timelineFilterDialogVisible = ref(false);

// For log details dialog
const detailsDialogVisible = ref(false);
const selectedLogId = ref(null);

// Table refresh handling
const refreshTable = ref(false);
const logTableRef = ref(null);

// Timeline data
const timelineEvents = ref([]);
const timelineLoading = ref(false);

// Set active tab and filter logs by action type
const setActiveTab = (index) => {
  tabMenuActiveIndex.value = index;
  // The filtering is now handled by the table component
};

// Handle month change from the table component
const handleMonthChange = (month) => {
  selectedMonth.value = month;
};

// Format month for display
const formatMonthDisplay = (date) => {
  if (!date) return "";
  return format(new Date(date), "MMMM yyyy");
};

// Open dialog to view log details
const viewLogDetails = (log) => {
  selectedLogId.value = log.id;
  detailsDialogVisible.value = true;
};

// Close log details dialog
const closeDetailsDialog = () => {
  detailsDialogVisible.value = false;
  selectedLogId.value = null;
};

// Handle table refresh
const handleTableRefresh = (shouldRefresh = false) => {
  if (shouldRefresh) {
    refreshTable.value = false;
    setTimeout(() => {
      refreshTable.value = true;
    }, 100);
  } else {
    refreshTable.value = false;
  }
};

// Toggle timeline filter dialog
const toggleTimelineFilterDialog = () => {
  timelineFilterDialogVisible.value = !timelineFilterDialogVisible.value;
};

// Clear timeline filter
const clearTimelineFilter = () => {
  timelineMonthFilter.value = null;
  timelineFilterDialogVisible.value = false;
  loadTimelineData();
};

// Apply timeline filter
const applyTimelineFilter = () => {
  loadTimelineData();
  timelineFilterDialogVisible.value = false;
};

// Get timeline item icon based on action
const getTimelineIcon = (action) => {
  const actionLower = action?.toLowerCase() || "";

  if (actionLower.includes("create")) {
    return "pi pi-plus";
  } else if (actionLower.includes("update")) {
    return "pi pi-pencil";
  } else if (actionLower.includes("delete")) {
    return "pi pi-trash";
  }

  return "pi pi-info-circle";
};

// Load timeline data
const loadTimelineData = async () => {
  try {
    timelineLoading.value = true;

    // Prepare parameters for the API call
    const params = {
      limit: 10,
      page: 1,
      sort: "createdAt:desc",
    };

    // Add date filtering if a month is selected
    if (timelineMonthFilter.value) {
      const selectedMonth = new Date(timelineMonthFilter.value);
      params.startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      params.endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
    }

    // Get most recent logs for the timeline
    const response = await getActivityLogs(params);

    if (response.data && response.data.logs) {
      // Format logs for timeline display
      timelineEvents.value = response.data.logs.map((log) => ({
        title: formatTimelineTitle(log),
        description: log.description.length > 100 ? log.description.substring(0, 100) + "..." : log.description,
        action: log.action,
        table: log.table,
        time: formatTimeAgo(log.createdAt),
        date: new Date(log.createdAt),
        raw: log, // Store the original log for viewing details
      }));
    }
  } catch (error) {
    console.error("Error loading timeline data:", error);
  } finally {
    timelineLoading.value = false;
  }
};

// Format timeline event title
const formatTimelineTitle = (log) => {
  const userName = log.User?.name || "Unknown user";
  const action = log.action?.toLowerCase() || "performed action";
  const table = log.table || "unknown";

  return `${userName} ${action}d on ${table}`;
};

// Format time as relative (e.g., "5 minutes ago")
const formatTimeAgo = (dateString) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (error) {
    return dateString;
  }
};

onMounted(() => {
  // Load timeline data on mount
  loadTimelineData();
});
</script>

<style scoped>
.custom-tabs {
  width: 100%;
  padding: 0;
  margin: 0;
}

.tab-container {
  display: flex;
  width: 100%;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 1rem;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  position: relative;
}

.tab-item:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.tab-item.active {
  border-bottom-color: #3b82f6;
  color: #3b82f6;
}

.tab-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.tab-label {
  white-space: nowrap;
}

/* Timeline custom styling */
:deep(.customized-timeline) .p-timeline-event-content,
:deep(.customized-timeline) .p-timeline-event-opposite {
  line-height: 1.5;
}

:deep(.customized-timeline) .timeline-event-content {
  background-color: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

:deep(.customized-timeline) .p-timeline-event-opposite {
  flex: 0;
  padding: 0 1rem;
}

:deep(.p-timeline-event) {
  margin-bottom: 0.5rem;
}

:deep(.p-timeline .p-timeline-event-marker) {
  border: 0;
}

:deep(.p-timeline .p-timeline-event-connector) {
  background-color: #e2e8f0;
}

/* Responsive styling */
@media (max-width: 768px) {
  .tab-container {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tab-item {
    flex: 0 0 auto;
    padding: 1rem;
  }
}
</style>
