<template>
  <div>
    <div class="flex flex-col justify-between gap-2 mb-4 md:flex-row">
      <!-- Custom search with icon inside on the left -->
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search by product, customer, or courier..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>

      <div class="flex gap-2">
        <Button icon="pi pi-filter" @click="$emit('filter')" :class="{ 'p-button-outlined p-button-info': filterActive }" text rounded title="Filter" />
        <Button icon="pi pi-download" @click="handleDownload" text rounded title="Download" />
        <Button v-tooltip.top="'View All Records'" icon="pi pi-list" @click="viewAllRecords" text rounded :class="{ 'p-button-outlined p-button-info': isViewingAll }" />
        <Button icon="pi pi-refresh" @click="loadDeliveries" text rounded :loading="loading" title="Refresh deliveries" />
      </div>
    </div>

    <!-- Loading Indicator -->
    <div v-if="loading" class="flex justify-center py-4">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="5" />
    </div>

    <!-- No Data Message -->
    <div v-else-if="deliveries.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
      <i class="mb-4 text-5xl text-gray-300 pi pi-truck"></i>
      <h3 class="text-xl font-semibold text-gray-600">No Deliveries Found</h3>
      <p class="mt-2 text-gray-500">Try adjusting your search or filter criteria.</p>
    </div>

    <!-- Data Table -->
    <DataTable
      v-else
      :value="deliveries"
      stripedRows
      :paginator="true"
      :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      emptyMessage="No deliveries found"
      class="p-datatable-sm"
      :sortOrder="-1"
      :multiSortMeta="multiSortMeta"
      @sort="onSort"
      removableSort
      dataKey="id"
      v-model:selection="selectedDeliveries"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="Sale.Customer.name" header="Customer" :sortable="true" style="min-width: 180px">
        <template #body="slotProps">
          {{ slotProps.data.Sale?.Customer?.name || "N/A" }}
        </template>
      </Column>
      <Column field="tracking_number" header="Tracking Number" :sortable="true" style="min-width: 180px">
        <template #body="slotProps">
          {{ slotProps.data.tracking_number || slotProps.data.trackingNumber || "N/A" }}
        </template>
      </Column>
      <Column field="status" header="Status" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          <Tag :severity="getStatusSeverity(slotProps.data.status)" :value="formatStatus(slotProps.data.status)" />
        </template>
      </Column>
      <Column field="shipping_method" header="Shipping Method" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          {{ slotProps.data.shipping_method || slotProps.data.shippingMethod || "N/A" }}
        </template>
      </Column>
      <Column field="courier" header="Courier" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          {{ slotProps.data.courier || "N/A" }}
        </template>
      </Column>
      <Column field="scheduled_date" header="Scheduled Date" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          <div class="flex flex-col">
            <span>{{ formatDate(slotProps.data.scheduled_date || slotProps.data.scheduledDate) }}</span>
          </div>
        </template>
      </Column>
      <Column header="Actions" style="min-width: 150px">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button icon="fi fi-rr-eye" severity="info" text rounded @click="$emit('view', slotProps.data)" aria-label="View" v-tooltip.top="'View Details'" />
            <Button icon="fi fi-rr-edit" severity="warning" text rounded @click="$emit('edit', slotProps.data)" aria-label="Edit" v-tooltip.top="'Edit Delivery'" />
            <Button icon="fi fi-rr-trash" severity="danger" text rounded @click="confirmDelete(slotProps.data)" aria-label="Delete" v-tooltip.top="'Delete Delivery'" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from "vue";
import { useConfirm } from "primevue/useconfirm";
import { showSuccess, showApiError } from "@/utils/toast";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import ProgressSpinner from "primevue/progressspinner";
import { format } from "date-fns";
import { getDeliveries, deleteDelivery } from "@/services/deliveryService";

const props = defineProps({
  statusFilter: {
    type: String,
    default: "",
  },
  refresh: {
    type: Boolean,
    default: false,
  },
  monthFilter: {
    type: Date,
    default: null,
  },
});

const emit = defineEmits(["view", "edit", "delete", "refresh", "filter"]);

// States
const confirm = useConfirm();
const loading = ref(false);
const deliveries = ref([]);
const selectedDeliveries = ref([]);
const searchDebounceTimer = ref(null);
const refreshTimer = ref(null);
const multiSortMeta = ref([{ field: "scheduled_date", order: 1 }]);
const isViewingAll = ref(false);
const pageSizeOptions = ref([10, 20, 50, 100]);
const lastQueryParams = ref({}); // Track last query parameters to avoid redundant requests

// Filters
const filters = ref({
  search: "",
  status: props.statusFilter,
  page: 1,
  limit: 10,
  sort: [],
  month: props.monthFilter,
  startDate: null,
  endDate: null,
});

// Computed property to determine if filters are active
const filterActive = computed(() => {
  return !!filters.value.month || !!filters.value.status;
});

// Pagination
const pagination = ref({
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
});

// Watch for status filter changes
watch(
  () => props.statusFilter,
  (newValue) => {
    filters.value.status = newValue;
    filters.value.page = 1;
    loadDeliveries();
  }
);

// Watch for month filter changes
watch(
  () => props.monthFilter,
  (newValue) => {
    filters.value.month = newValue;
    filters.value.page = 1;
    loadDeliveries();
  }
);

// Watch for refresh trigger
watch(
  () => props.refresh,
  (newValue) => {
    if (newValue === true) {
      loadDeliveries().then(() => {
        emit("refresh", false);
      });
    }
  }
);

// Handle search input with debounce - optimize debounce time
const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer.value);
  searchDebounceTimer.value = setTimeout(() => {
    if (!loading.value) {
      filters.value.page = 1;
      loadDeliveries();
    }
  }, 300); // Reduced from 500ms to 300ms for faster response
};

// Handle sort event
const onSort = (event) => {
  multiSortMeta.value = event.multiSortMeta;

  // Map the sort metadata to a format the API can understand
  const sortFields = multiSortMeta.value.map((meta) => {
    return {
      field: meta.field,
      order: meta.order === 1 ? "asc" : "desc",
    };
  });

  filters.value.sort = sortFields;

  // Reload data with new sort
  loadDeliveries();
};

// Load deliveries data - optimized for performance
const loadDeliveries = async () => {
  if (loading.value) return Promise.resolve();

  try {
    // Prepare query parameters
    const queryParams = {
      search: filters.value.search,
      status: filters.value.status,
      page: filters.value.page,
      limit: filters.value.limit,
    };

    // Add month filter if it exists
    if (filters.value.month) {
      const date = new Date(filters.value.month);
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const year = date.getFullYear();
      queryParams.month = `${year}-${month < 10 ? "0" + month : month}`;
    }

    // Add sort if exists
    if (filters.value.sort && filters.value.sort.length) {
      queryParams.sort = JSON.stringify(filters.value.sort);
    }

    // Check if this is the same query we just made (to avoid redundant requests)
    const queryString = JSON.stringify(queryParams);
    if (queryString === JSON.stringify(lastQueryParams.value) && deliveries.value.length > 0) {
      console.log("Skipping duplicate query");
      return { data: { deliveries: deliveries.value } };
    }

    // Save the current query params
    lastQueryParams.value = { ...queryParams };

    // Start loading
    loading.value = true;

    // Make the API request
    const response = await getDeliveries(queryParams);

    if (response.data && response.data.deliveries) {
      deliveries.value = response.data.deliveries;
      pagination.value = {
        totalItems: response.data.totalItems || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || 1,
      };
    } else {
      console.error("Unexpected deliveries response structure:", response.data);
      deliveries.value = [];
    }

    return response;
  } catch (error) {
    console.error("Error loading deliveries:", error);

    // More detailed error handling
    let errorMessage = "Failed to load deliveries";
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (error.response.status === 403) {
        errorMessage = "You don't have permission to view deliveries.";
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }

    showApiError(errorMessage);

    deliveries.value = [];
    return Promise.reject(error);
  } finally {
    loading.value = false;
  }
};

// Confirm delete
const confirmDelete = (delivery) => {
  confirm.require({
    message: "Are you sure you want to delete this delivery?",
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(delivery.id),
  });
};

// Handle delete
const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteDelivery(id);
    showSuccess("Delivery deleted successfully");
    emit("delete", id);
    await loadDeliveries();
  } catch (error) {
    console.error("Error deleting delivery:", error);
    showApiError("Failed to delete delivery");
  } finally {
    loading.value = false;
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    return dateString;
  }
};

// Format status
const formatStatus = (status) => {
  if (!status) return "N/A";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Get status severity for tag color
const getStatusSeverity = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "processing":
      return "info";
    case "shipped":
      return "primary";
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "secondary";
  }
};

// Handle download
const handleDownload = () => {
  showApiError("Download functionality will be implemented later");
};

// View all records
const viewAllRecords = async () => {
  try {
    isViewingAll.value = !isViewingAll.value;

    if (isViewingAll.value) {
      // When viewing all, set a high limit
      filters.value.limit = 1000;
      showApiError("Loading all records, this may take a moment...");
    } else {
      // Reset to default limit
      filters.value.limit = pageSizeOptions.value[0];
    }

    await loadDeliveries();
  } catch (error) {
    console.error("Error toggling view all:", error);
    isViewingAll.value = false;
  }
};

// Start auto-refresh mechanism
const startAutoRefresh = () => {
  stopAutoRefresh();
  refreshTimer.value = setInterval(() => {
    if (!loading.value) {
      loadDeliveries().catch((error) => {
        console.error("Auto-refresh error:", error);
      });
    }
  }, 300000); // 5 minutes refresh interval
};

// Stop auto-refresh
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

// Clean up timer
const cleanupTimers = () => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
  stopAutoRefresh();
};

onMounted(() => {
  loadDeliveries();
  startAutoRefresh();
});

onUnmounted(() => {
  cleanupTimers();
});

// Export a method to force refresh the deliveries list
defineExpose({
  refreshDeliveries: loadDeliveries,
  startAutoRefresh,
  stopAutoRefresh,
});
</script>

<style scoped>
/* Style for table rows */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #f8fafc;
}

:deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
  background-color: #eff6ff;
}
</style>
