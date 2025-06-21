<template>
  <div>
    <div class="flex flex-col justify-between gap-2 mb-4 md:flex-row">
      <!-- Custom search with icon inside on the left -->
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search in logs..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>

      <div class="flex gap-2">
        <Button icon="pi pi-filter" @click="toggleFilterPanel" :class="{ 'p-button-outlined p-button-info': filterActive }" text rounded title="Filter" />
        <Button icon="pi pi-download" @click="handleDownload" text rounded title="Download" />
        <Button v-tooltip.top="'View All Records'" icon="pi pi-list" @click="viewAllRecords" text rounded :class="{ 'p-button-outlined p-button-info': isViewingAll }" />
        <Button icon="pi pi-refresh" @click="loadLogs" text rounded :loading="loading" title="Refresh" />
      </div>
    </div>

    <!-- Filter Dialog -->
    <Dialog v-model:visible="filterDialogVisible" header="Filter Activity Logs" :style="{ width: '450px' }" :modal="true">
      <div class="grid grid-cols-1 gap-4 p-3">
        <!-- Month filter -->
        <div class="col-span-1">
          <h3 class="mb-2 font-medium text-gray-700">Filter by Month</h3>
          <Calendar v-model="filters.month" view="month" dateFormat="mm/yy" placeholder="Select month" class="w-full" />
        </div>

        <!-- Action filter -->
        <div class="col-span-1">
          <h3 class="mb-2 font-medium text-gray-700">Filter by Action</h3>
          <Dropdown v-model="filters.action" :options="actionOptions" optionLabel="label" optionValue="value" placeholder="Select action" class="w-full" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Clear Filters" @click="clearFilters" outlined />
          <Button label="Apply" @click="applyFilters" />
        </div>
      </template>
    </Dialog>

    <DataTable
      :value="logs"
      stripedRows
      :paginator="true"
      :rows="pageSizeOptions[0]"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="pageSizeOptions"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      :loading="loading"
      emptyMessage="No activity logs found"
      class="p-datatable-sm"
      dataKey="id"
      v-model:selection="selectedLogs"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="id" header="ID" :sortable="true" style="min-width: 130px">
        <template #body="slotProps">
          <span class="font-medium text-blue-600">{{ truncateId(slotProps.data.id) }}</span>
        </template>
      </Column>
      <Column field="User.name" header="User" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          {{ slotProps.data.User ? slotProps.data.User.name : "-" }}
        </template>
      </Column>
      <Column field="action" header="Action" :sortable="true" style="min-width: 120px">
        <template #body="slotProps">
          <div :class="getActionRowClass(slotProps.data.action)" class="p-2 rounded">
            <Tag :severity="getActionSeverity(slotProps.data.action)" :value="slotProps.data.action" />
          </div>
        </template>
      </Column>
      <Column field="table" header="Table" :sortable="true" style="min-width: 120px">
        <template #body="slotProps">
          <Badge :value="slotProps.data.table" class="text-xs font-medium" />
        </template>
      </Column>
      <Column field="description" header="Description" :sortable="true" style="min-width: 250px">
        <template #body="slotProps">
          <div class="line-clamp-2">{{ slotProps.data.description }}</div>
        </template>
      </Column>
      <Column field="createdAt" header="Created At" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          <div class="flex flex-col">
            <span>{{ formatDate(slotProps.data.createdAt) }}</span>
            <span class="text-xs text-gray-500">{{ formatTime(slotProps.data.createdAt) }}</span>
          </div>
        </template>
      </Column>
      <Column header="Actions" style="min-width: 150px">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button icon="pi pi-eye" severity="info" text rounded @click="viewDetails(slotProps.data)" aria-label="View" />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(slotProps.data)" aria-label="Delete" />
          </div>
        </template>
      </Column>
    </DataTable>

    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from "vue";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import ConfirmDialog from "primevue/confirmdialog";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Calendar from "primevue/calendar";
import { getActivityLogs, deleteActivityLog } from "@/services/activityLogService";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { getActionSeverity, getActionRowClass } from "@/utils/actionUtils";

const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
  activeTab: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["view", "refresh", "month-change"]);

const confirm = useConfirm();
const toast = useToast();
const logs = ref([]);
const selectedLogs = ref([]);
const loading = ref(false);
const pageSizeOptions = ref([10, 20, 50, 100, 200]);
const isViewingAll = ref(false);
const filterDialogVisible = ref(false);
const filters = ref({
  search: "",
  page: 1,
  limit: 10,
  month: null,
  startDate: null,
  endDate: null,
  action: null,
});

// Action options for dropdown
const actionOptions = ref([
  { label: "All Actions", value: null },
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
]);

// Compute if any filters are active
const filterActive = computed(() => {
  return !!filters.value.month || !!filters.value.action;
});

// Toggle filter panel
const toggleFilterPanel = () => {
  filterDialogVisible.value = !filterDialogVisible.value;
};

// Clear filters
const clearFilters = () => {
  filters.value.month = null;
  filters.value.startDate = null;
  filters.value.endDate = null;
  filters.value.action = null;
  emit("month-change", null);
  loadLogs();
  filterDialogVisible.value = false;
};

// Apply filters
const applyFilters = () => {
  // Process date filters
  if (filters.value.month) {
    const selectedMonth = new Date(filters.value.month);
    filters.value.startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    filters.value.endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
    emit("month-change", filters.value.month);
  } else {
    filters.value.startDate = null;
    filters.value.endDate = null;
    emit("month-change", null);
  }

  // Close dialog and reload logs
  filterDialogVisible.value = false;
  loadLogs();
};

// For auto-refresh and debounce
const refreshTimer = ref(null);
const searchDebounceTimer = ref(null);

const pagination = ref({
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
});

// Watch for changes in tab from parent
watch(
  () => props.activeTab,
  (newVal) => {
    switch (newVal) {
      case 1: // Create events
        filters.value.action = "create";
        break;
      case 2: // Update events
        filters.value.action = "update";
        break;
      case 3: // Delete events
        filters.value.action = "delete";
        break;
      default: // All logs
        filters.value.action = null;
        break;
    }
    loadLogs();
  }
);

const loadLogs = async () => {
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;

    const response = await getActivityLogs(filters.value);

    if (response.data && response.data.logs) {
      logs.value = response.data.logs;
      pagination.value = {
        totalItems: response.data.totalItems,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
      };
    } else {
      logs.value = [];
    }

    return response;
  } catch (error) {
    console.error("Error loading activity logs:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal memuat log aktivitas",
      life: 3000,
    });
    return Promise.reject(error);
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer.value);
  searchDebounceTimer.value = setTimeout(() => {
    if (!loading.value) {
      loadLogs();
    }
  }, 500);
};

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    return dateString;
  }
};

const formatTime = (dateString) => {
  try {
    return format(new Date(dateString), "HH:mm:ss");
  } catch (error) {
    return "";
  }
};

const truncateId = (id) => {
  if (!id) return "";
  return id.substring(0, 8) + "...";
};

const handleDownload = () => {
  toast.add({
    severity: "info",
    summary: "Download",
    detail: "Fitur download akan segera tersedia di sini",
    life: 3000,
  });
};

const viewDetails = (log) => {
  emit("view", log);
};

const confirmDelete = (log) => {
  confirm.require({
    message: `Are you sure you want to delete this activity log?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(log.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteActivityLog(id);

    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Activity log deleted successfully",
      life: 3000,
    });

    await loadLogs();
    emit("refresh", true);
  } catch (error) {
    console.error("Error deleting activity log:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to delete activity log",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Start auto-refresh mechanism
const startAutoRefresh = () => {
  stopAutoRefresh();
  refreshTimer.value = setInterval(() => {
    if (!loading.value) {
      loadLogs().catch((error) => {
        console.error("Auto-refresh error:", error);
      });
    }
  }, 300000); // 5 minutes refresh interval
};

// Add a direct refresh method that can be called from parent
const directRefresh = async () => {
  if (!loading.value) {
    return loadLogs();
  }
  return Promise.resolve();
};

// Stop auto-refresh
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

// Clean up all timers
const cleanupTimers = () => {
  stopAutoRefresh();
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
};

onMounted(() => {
  loadLogs();
  startAutoRefresh();
});

onUnmounted(() => {
  cleanupTimers();
});

// Watch for refresh prop changes
watch(
  () => props.refresh,
  (newVal) => {
    if (newVal === true) {
      directRefresh()
        .then(() => {
          emit("refresh", false);
        })
        .catch(() => {
          emit("refresh", false);
        });
    }
  }
);

// Expose methods for parent component
defineExpose({
  loadLogs,
  startAutoRefresh,
  stopAutoRefresh,
  directRefresh,
});

const handleMonthChange = () => {
  // Emit the month change to parent component
  emit("month-change", filters.value.month);

  if (!loading.value) {
    loadLogs();
  }
};

// View all records
const viewAllRecords = async () => {
  try {
    isViewingAll.value = !isViewingAll.value;

    if (isViewingAll.value) {
      // When viewing all, set a high limit
      filters.value.limit = 1000;
      toast.add({
        severity: "info",
        summary: "View All",
        detail: "Loading all records, this may take a moment...",
        life: 3000,
      });
    } else {
      // Reset to default limit
      filters.value.limit = pageSizeOptions.value[0];
    }

    await loadLogs();
  } catch (error) {
    console.error("Error toggling view all:", error);
    isViewingAll.value = false;
  }
};
</script>

<style scoped>
/* Add custom styles for the table rows */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #f8fafc;
}

:deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
  background-color: #eff6ff;
}
</style>
