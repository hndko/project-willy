<template>
  <DashboardLayout pageTitle="Delivery Management">
    <div class="grid grid-cols-1 gap-4">
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-semibold text-gray-800">Delivery Orders</h1>
              <Tag v-if="selectedStatus === ''" severity="info" value="All Deliveries" />
              <Tag v-else-if="selectedStatus === 'pending'" severity="warning" value="Pending" />
              <Tag v-else-if="selectedStatus === 'processing'" severity="info" value="Processing" />
              <Tag v-else-if="selectedStatus === 'shipped'" severity="primary" value="Shipped" />
              <Tag v-else-if="selectedStatus === 'delivered'" severity="success" value="Delivered" />
              <Tag v-else-if="selectedStatus === 'cancelled'" severity="danger" value="Cancelled" />
            </div>
          </div>
        </template>
        <template #content>
          <!-- Custom Tab Navigation -->
          <div class="mb-4 custom-tabs">
            <div class="tab-container">
              <div v-for="(item, index) in statusFilters" :key="index" class="tab-item" :class="{ active: selectedStatus === item.value }" @click="handleStatusFilterChange(item.value)">
                <i :class="['tab-icon', item.icon]"></i>
                <span class="tab-label">{{ item.label }}</span>
              </div>
            </div>
          </div>

          <!-- Filter Dialog -->
          <Dialog v-model:visible="filterDialogVisible" header="Filter Deliveries" :style="{ width: '450px' }" :modal="true">
            <div class="grid grid-cols-1 gap-4 p-3">
              <!-- Month filter -->
              <div class="col-span-1">
                <h3 class="mb-2 font-medium text-gray-700">Filter by Month</h3>
                <Calendar v-model="filters.month" view="month" dateFormat="mm/yy" placeholder="Select month" class="w-full" />
              </div>

              <!-- Status filter -->
              <div class="col-span-1">
                <h3 class="mb-2 font-medium text-gray-700">Filter by Status</h3>
                <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Select status" class="w-full" />
              </div>
            </div>
            <template #footer>
              <div class="flex justify-end gap-2">
                <Button label="Clear Filters" @click="clearFilters" outlined />
                <Button label="Apply" @click="applyFilters" />
              </div>
            </template>
          </Dialog>

          <!-- Table View -->
          <div v-if="!selectedDelivery && !showDeliveryForm">
            <DeliveryTable ref="deliveryTable" :statusFilter="selectedStatus" :refresh="refreshTable" :monthFilter="filters.month" @view="viewDelivery" @edit="editDelivery" @delete="handleDelete" @refresh="handleTableRefresh" @filter="toggleFilterDialog" />
          </div>

          <!-- Delivery Detail View -->
          <div v-else-if="selectedDelivery && !showDeliveryForm">
            <div class="flex justify-between mb-4">
              <h2 class="text-xl font-semibold">Delivery Details</h2>
              <div class="flex gap-2">
                <Button icon="fi fi-rr-arrow-left" label="Back" @click="backToList" />
                <Button icon="fi fi-rr-edit" label="Edit" severity="warning" @click="editDelivery(selectedDelivery)" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card class="shadow-sm">
                <template #title>
                  <h3 class="text-lg font-semibold">Sale Information</h3>
                </template>
                <template #content>
                  <div v-if="selectedDelivery.Sale">
                    <div class="flex flex-col gap-2">
                      <div class="flex flex-row justify-between">
                        <span class="font-medium">Product:</span>
                        <span>{{ selectedDelivery.Sale.Product?.name || "N/A" }}</span>
                      </div>
                      <div class="flex flex-row justify-between">
                        <span class="font-medium">Customer:</span>
                        <span>{{ selectedDelivery.Sale.Customer?.name || "N/A" }}</span>
                      </div>
                      <div class="flex flex-row justify-between">
                        <span class="font-medium">Quantity:</span>
                        <span>{{ selectedDelivery.Sale.qty }}</span>
                      </div>
                      <div class="flex flex-row justify-between">
                        <span class="font-medium">Total:</span>
                        <span>{{ formatPrice(selectedDelivery.Sale.total) }}</span>
                      </div>
                      <div class="flex flex-row justify-between">
                        <span class="font-medium">Date:</span>
                        <span>{{ formatDate(selectedDelivery.Sale.date) }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else>
                    <p>Sale information not available</p>
                  </div>
                </template>
              </Card>

              <Card class="shadow-sm">
                <template #title>
                  <h3 class="text-lg font-semibold">Delivery Information</h3>
                </template>
                <template #content>
                  <div class="flex flex-col gap-2">
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Status:</span>
                      <Tag :severity="getStatusSeverity(selectedDelivery.status)" :value="formatStatus(selectedDelivery.status)" />
                    </div>
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Shipping Address:</span>
                      <span>{{ selectedDelivery.shipping_address || selectedDelivery.shippingAddress || "N/A" }}</span>
                    </div>
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Shipping Method:</span>
                      <span>{{ selectedDelivery.shipping_method || selectedDelivery.shippingMethod || "N/A" }}</span>
                    </div>
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Courier:</span>
                      <span>{{ selectedDelivery.courier || "N/A" }}</span>
                    </div>
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Tracking Number:</span>
                      <span>{{ selectedDelivery.tracking_number || selectedDelivery.trackingNumber || "N/A" }}</span>
                    </div>
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Scheduled Date:</span>
                      <span>{{ formatDate(selectedDelivery.scheduled_date || selectedDelivery.scheduledDate) }}</span>
                    </div>
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Delivery Date:</span>
                      <span>{{ formatDate(selectedDelivery.delivery_date || selectedDelivery.deliveryDate) }}</span>
                    </div>
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Created At:</span>
                      <span>{{ formatDate(selectedDelivery.created_at || selectedDelivery.createdAt) }}</span>
                    </div>
                    <div class="flex flex-row justify-between">
                      <span class="font-medium">Last Updated:</span>
                      <span>{{ formatDate(selectedDelivery.updated_at || selectedDelivery.updatedAt) }}</span>
                    </div>
                    <div v-if="selectedDelivery.notes" class="mt-2">
                      <div class="font-medium">Notes:</div>
                      <p class="mt-1 whitespace-pre-line">{{ selectedDelivery.notes }}</p>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>

          <!-- Delivery Form View -->
          <div v-else-if="showDeliveryForm" class="card">
            <div class="flex justify-between mb-4">
              <h2 class="text-xl font-semibold">{{ formDelivery ? "Edit Delivery" : "Create Delivery" }}</h2>
              <Button icon="fi fi-rr-arrow-left" label="Back" @click="cancelForm" />
            </div>

            <DeliveryForm :sale="formSale" :isEdit="!!formDelivery" @save="handleFormSave" @cancel="cancelForm" />
          </div>
        </template>
      </Card>
    </div>

    <Toast />
    <ConfirmDialog></ConfirmDialog>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useConfirm } from "primevue/useconfirm";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Toast from "primevue/toast";
import Tag from "primevue/tag";
import ConfirmDialog from "primevue/confirmdialog";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { getDeliveries, getDeliveryById, deleteDelivery } from "@/services/deliveryService";
import DeliveryForm from "@/components/deliveries/DeliveryForm.vue";
import DeliveryTable from "@/components/deliveries/DeliveryTable.vue";
import { eventBus } from "@/utils/eventBus";
import { showSuccess, showApiError } from "@/utils/toast";

const confirm = useConfirm();

// States
const loading = ref(false);
const deliveries = ref([]);
const selectedDelivery = ref(null);
const showDeliveryForm = ref(false);
const formDelivery = ref(null);
const formSale = ref(null);
const selectedStatus = ref("");
const searchDebounceTimer = ref(null);
const refreshTable = ref(false);
const deliveryTable = ref(null);
const filterDialogVisible = ref(false);

// Status filter options
const statusFilters = ref([
  { label: "All Deliveries", icon: "pi pi-list", value: "" },
  { label: "Pending", icon: "pi pi-clock", value: "pending" },
  { label: "Processing", icon: "pi pi-cog", value: "processing" },
  { label: "Shipped", icon: "pi pi-truck", value: "shipped" },
  { label: "Delivered", icon: "pi pi-check-circle", value: "delivered" },
  { label: "Cancelled", icon: "pi pi-times-circle", value: "cancelled" },
]);

// Status dropdown options for filter dialog
const statusOptions = ref([
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
]);

// Filters
const filters = ref({
  search: "",
  status: "",
  page: 1,
  limit: 10,
  month: null,
  startDate: null,
  endDate: null,
});

// Pagination
const pagination = ref({
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
});

// Toggle filter dialog
const toggleFilterDialog = () => {
  filterDialogVisible.value = !filterDialogVisible.value;
};

// Clear filters
const clearFilters = () => {
  filters.value.month = null;
  filters.value.startDate = null;
  filters.value.endDate = null;
  filters.value.status = "";
  selectedStatus.value = "";

  // Close dialog
  filterDialogVisible.value = false;

  // Force refresh of data
  if (deliveryTable.value) {
    filters.value.page = 1; // Reset to first page
    deliveryTable.value.refreshDeliveries();
  } else {
    triggerTableRefresh();
  }
};

// Apply filters - optimized for performance
const applyFilters = () => {
  // Process date filters
  if (filters.value.month) {
    const selectedMonth = new Date(filters.value.month);
    // We don't need to store these as they're calculated in the backend
    // Just storing the month value is enough
  } else {
    filters.value.startDate = null;
    filters.value.endDate = null;
  }

  // Sync status filter with selected tab
  selectedStatus.value = filters.value.status;

  // Reset to first page when applying filters
  filters.value.page = 1;

  // Close dialog immediately for better UX
  filterDialogVisible.value = false;

  // Use a small timeout to allow the dialog to close before refreshing
  // This makes the UI feel more responsive
  setTimeout(() => {
    if (deliveryTable.value) {
      deliveryTable.value.refreshDeliveries();
    } else {
      triggerTableRefresh();
    }
  }, 50);
};

// Handle status filter change
const handleStatusFilterChange = (status) => {
  selectedStatus.value = status;
  filters.value.status = status;
  if (deliveryTable.value) {
    deliveryTable.value.refreshDeliveries();
  }
};

// Debounced search input handler
const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer.value);
  searchDebounceTimer.value = setTimeout(() => {
    if (!loading.value) {
      filters.value.page = 1;
      loadDeliveries();
    }
  }, 500);
};

// Load deliveries data
const loadDeliveries = async () => {
  if (loading.value) return;

  try {
    loading.value = true;

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
  } catch (error) {
    console.error("Error loading deliveries:", error);
    showApiError("Error", "Failed to load deliveries");
  } finally {
    loading.value = false;
  }
};

// View delivery details
const viewDelivery = async (delivery) => {
  try {
    loading.value = true;
    const response = await getDeliveryById(delivery.id);
    selectedDelivery.value = response.data;
    showDeliveryForm.value = false;
  } catch (error) {
    console.error("Error loading delivery details:", error);
    showApiError("Error", "Failed to load delivery details");
  } finally {
    loading.value = false;
  }
};

// Edit delivery
const editDelivery = (delivery) => {
  formDelivery.value = delivery;
  formSale.value = delivery.Sale;
  showDeliveryForm.value = true;
  selectedDelivery.value = null;
};

// Back to delivery list
const backToList = () => {
  selectedDelivery.value = null;
  showDeliveryForm.value = false;
  formDelivery.value = null;
  formSale.value = null;
};

// Cancel form
const cancelForm = () => {
  if (selectedDelivery.value) {
    showDeliveryForm.value = false;
  } else {
    backToList();
  }
  formDelivery.value = null;
  formSale.value = null;
};

// Handle form save
const handleFormSave = () => {
  showSuccess("Success", formDelivery.value ? "Delivery updated successfully" : "Delivery created successfully");
  backToList();
  triggerTableRefresh();
};

// Trigger table refresh - improved with loading state management
const triggerTableRefresh = () => {
  if (deliveryTable.value) {
    deliveryTable.value.refreshDeliveries();
  } else {
    // Fallback if ref is not available
    refreshTable.value = !refreshTable.value;
  }
};

// Handle table refresh event
const handleTableRefresh = (shouldRefresh = false) => {
  if (shouldRefresh) {
    triggerTableRefresh();
  } else {
    refreshTable.value = false;
  }
};

// Handle delete
const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteDelivery(id);
    showSuccess("Success", "Delivery deleted successfully");
    backToList();
    triggerTableRefresh();
  } catch (error) {
    console.error("Error deleting delivery:", error);
    showApiError("Error", "Failed to delete delivery");
  } finally {
    loading.value = false;
  }
};

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price || 0);
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

// Clean up timer
const cleanupTimers = () => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
};

// Listen for delivery update events from other components
onMounted(() => {
  // Listen for delivery updates from Sales view
  eventBus.on("delivery-updated", handleDeliveryUpdated);
  loadDeliveries();
});

// Clean up event listeners when component is unmounted
onUnmounted(() => {
  eventBus.off("delivery-updated", handleDeliveryUpdated);
  cleanupTimers();
});

// Handle delivery update event from other components
const handleDeliveryUpdated = (deliveryData) => {
  console.log("Delivery updated event received:", deliveryData);
  triggerTableRefresh();
};
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
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  color: #64748b;
  flex: 0 0 auto;
}

.tab-item:hover {
  background-color: rgba(59, 130, 246, 0.05);
  color: #3b82f6;
}

.tab-item.active {
  border-bottom-color: #3b82f6;
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
  font-weight: 600;
}

.tab-icon {
  font-size: 1.125rem;
}

.tab-label {
  white-space: nowrap;
  font-size: 0.9rem;
}

.tab-count {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  background-color: #e5e7eb;
  border-radius: 9999px;
  padding: 0.1rem 0.5rem;
  min-width: 1.5rem;
  text-align: center;
  display: inline-block;
}

.tab-item.active .tab-count {
  background-color: #3b82f6;
  color: white;
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
