<template>
  <div>
    <div class="flex flex-col justify-between gap-2 mb-4 md:flex-row">
      <!-- Custom search with icon inside on the left -->
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search by product, customer, or sales person..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>

      <div class="flex gap-2">
        <Button icon="pi pi-filter" @click="toggleFilterDialog" :class="{ 'p-button-outlined p-button-info': filterActive }" text rounded title="Filter" />
        <Button icon="pi pi-download" @click="handleDownload" text rounded title="Download" />
        <Button v-tooltip.top="'View All Records'" icon="pi pi-list" @click="viewAllRecords" text rounded :class="{ 'p-button-outlined p-button-info': isViewingAll }" />
        <Button icon="pi pi-refresh" @click="loadSales" text rounded :loading="loading" title="Refresh" />
      </div>
    </div>

    <!-- Filter Dialog -->
    <Dialog v-model:visible="filterDialogVisible" header="Filter Sales" :style="{ width: '450px' }" :modal="true">
      <div class="grid grid-cols-1 gap-4 p-3">
        <!-- Month filter -->
        <div class="col-span-1">
          <h3 class="mb-2 font-medium text-gray-700">Filter by Month</h3>
          <Calendar v-model="filters.month" view="month" dateFormat="mm/yy" placeholder="Select month" class="w-full" />
        </div>

        <!-- Payment Status filter -->
        <div class="col-span-1">
          <h3 class="mb-2 font-medium text-gray-700">Filter by Payment Status</h3>
          <Dropdown v-model="filters.paymentStatus" :options="paymentStatusOptions" optionLabel="label" optionValue="value" placeholder="Select payment status" class="w-full" />
        </div>

        <!-- Delivery Status filter -->
        <div class="col-span-1">
          <h3 class="mb-2 font-medium text-gray-700">Filter by Delivery Status</h3>
          <Dropdown v-model="filters.deliveryStatus" :options="deliveryStatusOptions" optionLabel="label" optionValue="value" placeholder="Select delivery status" class="w-full" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Clear Filters" @click="clearFilters" outlined />
          <Button label="Apply" @click="applyFilters" />
        </div>
      </template>
    </Dialog>

    <!-- Loading Indicator -->
    <div v-if="loading" class="flex justify-center py-4">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="5" />
    </div>

    <!-- No Data Message -->
    <div v-else-if="sales.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
      <i class="mb-4 text-5xl text-gray-300 pi pi-shopping-cart"></i>
      <h3 class="text-xl font-semibold text-gray-600">No Sales Found</h3>
      <p class="mt-2 text-gray-500">Try adjusting your search or filter criteria.</p>
    </div>

    <!-- Data Table -->
    <DataTable
      v-else
      :value="sales"
      stripedRows
      :paginator="true"
      :rows="pageSizeOptions[0]"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="pageSizeOptions"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      emptyMessage="No sales found"
      class="p-datatable-sm"
      dataKey="id"
      v-model:selection="selectedSales"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="id" header="Order ID" :sortable="true" style="min-width: 130px">
        <template #body="slotProps">
          <span class="font-medium text-blue-600">{{ truncateId(slotProps.data.id) }}</span>
        </template>
      </Column>

      <!-- Add status column with icons -->
      <Column field="status" header="Status" :sortable="false" style="min-width: 150px">
        <template #body="slotProps">
          <div class="flex items-center gap-2">
            <!-- Payment Status -->
            <div class="status-icon-wrapper" :title="getPaymentStatusText(slotProps.data)">
              <i :class="['status-icon', getPaymentStatusIcon(slotProps.data)]"></i>
            </div>

            <!-- Processing Status (based on whether a delivery exists) -->
            <div class="status-icon-wrapper" :title="getProcessingStatusText(slotProps.data)">
              <i :class="['status-icon', getProcessingStatusIcon(slotProps.data)]"></i>
            </div>

            <!-- Shipping Status -->
            <div class="status-icon-wrapper" :title="getShippingStatusText(slotProps.data)">
              <i :class="['status-icon', getShippingStatusIcon(slotProps.data)]"></i>
            </div>

            <!-- Completion Status -->
            <div class="status-icon-wrapper" :title="getCompletionStatusText(slotProps.data)">
              <i :class="['status-icon', getCompletionStatusIcon(slotProps.data)]"></i>
            </div>
          </div>
        </template>
      </Column>

      <Column field="Product.name" header="Product" :sortable="true" style="min-width: 180px" />
      <Column field="Customer.name" header="Customer" :sortable="true" style="min-width: 180px">
        <template #body="slotProps">
          {{ slotProps.data.Customer ? slotProps.data.Customer.name : "-" }}
        </template>
      </Column>
      <Column field="User.name" header="Sales Person" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          {{ slotProps.data.User ? slotProps.data.User.name : "-" }}
        </template>
      </Column>
      <Column field="qty" header="Quantity" :sortable="true" style="min-width: 100px" />
      <Column field="price" header="Price" :sortable="true" style="min-width: 120px">
        <template #body="slotProps">
          {{ formatPrice(slotProps.data.price) }}
        </template>
      </Column>
      <Column field="total" header="Total" :sortable="true" style="min-width: 120px">
        <template #body="slotProps">
          {{ formatPrice(slotProps.data.total) }}
        </template>
      </Column>
      <Column field="paymentStatus" header="Payment Status" :sortable="true" style="min-width: 130px">
        <template #body="slotProps">
          <Tag :severity="getPaymentTagSeverity(slotProps.data.paymentStatus)" :value="formatPaymentStatus(slotProps.data.paymentStatus)" />
        </template>
      </Column>
      <Column field="paymentMethod" header="Payment Method" :sortable="true" style="min-width: 130px">
        <template #body="slotProps">
          {{ formatPaymentMethod(slotProps.data.paymentMethod) }}
        </template>
      </Column>
      <Column field="date" header="Date" :sortable="true" style="min-width: 120px">
        <template #body="slotProps">
          <div class="flex flex-col">
            <span>{{ formatDate(slotProps.data.date) }}</span>
            <span class="text-xs text-gray-500">{{ formatTime(slotProps.data.date) }}</span>
          </div>
        </template>
      </Column>
      <Column field="Delivery.status" header="Delivery Status" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          <Tag v-if="slotProps.data.Delivery" :severity="getDeliveryStatusSeverity(slotProps.data.Delivery.status)" :value="formatDeliveryStatus(slotProps.data.Delivery.status)" />
          <Tag v-else severity="secondary" value="No Delivery" />
        </template>
      </Column>
      <Column field="Invoice" header="Invoice" style="min-width: 120px">
        <template #body="slotProps">
          <div class="flex items-center gap-1">
            <Tag v-if="slotProps.data.Invoices && slotProps.data.Invoices.length > 0 && slotProps.data.Invoices[0].invoiceNumber" severity="success" class="mr-2">
              {{ slotProps.data.Invoices[0].invoiceNumber }}
            </Tag>
            <span v-else class="text-sm text-gray-500 mr-2">No Invoice</span>
            <Button
              v-if="!slotProps.data.Invoices || slotProps.data.Invoices.length === 0 || !slotProps.data.Invoices[0].invoiceNumber"
              icon="pi pi-file-invoice"
              severity="info"
              text
              rounded
              @click="handleGenerateInvoice(slotProps.data)"
              :disabled="invoiceLoading === slotProps.data.id"
              v-tooltip.top="'Generate Invoice'"
            />
            <Button v-else icon="pi pi-file-pdf" severity="secondary" text rounded @click="handleViewInvoice(slotProps.data.Invoices[0].id)" v-tooltip.top="'View Invoice PDF'" />
          </div>
        </template>
      </Column>
      <Column header="Actions" :exportable="false" style="min-width: 12rem">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button icon="pi pi-eye" severity="info" text rounded @click="viewSale(slotProps.data)" aria-label="View" v-tooltip.top="'View Details'" />
            <Button icon="pi pi-pencil" severity="warning" text rounded @click="$emit('edit', slotProps.data)" aria-label="Edit" v-tooltip.top="'Edit Sale'" />
            <Button icon="pi pi-truck" :severity="slotProps.data.Delivery ? 'help' : 'success'" text rounded @click="$emit('manageDelivery', slotProps.data)" aria-label="Manage Delivery" v-tooltip.top="slotProps.data.Delivery ? 'Update Delivery' : 'Create Delivery'" />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(slotProps.data)" aria-label="Delete" v-tooltip.top="'Delete Sale'" />
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
import { getSales, deleteSale } from "@/services/saleService";
import { format, startOfMonth, endOfMonth } from "date-fns";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Calendar from "primevue/calendar";
import ProgressSpinner from "primevue/progressspinner";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import { createInvoice, generateInvoicePDF } from "@/services/invoiceService";

const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
  statusFilter: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["edit", "refresh", "manageDelivery", "view"]);

const confirm = useConfirm();
const toast = useToast();
const sales = ref([]);
const selectedSales = ref([]);
const loading = ref(false);
const pageSizeOptions = ref([10, 20, 50, 100, 200]);
const isViewingAll = ref(false);
const filterDialogVisible = ref(false);
const filters = ref({
  search: "",
  page: 1,
  limit: 10,
  statusFilter: "",
  month: null,
  startDate: null,
  endDate: null,
  paymentStatus: null,
  deliveryStatus: null,
});

// Payment status options for dropdown
const paymentStatusOptions = ref([
  { label: "All Statuses", value: null },
  { label: "Paid", value: "paid" },
  { label: "Partially Paid", value: "partial" },
  { label: "Unpaid", value: "unpaid" },
]);

// Delivery status options for dropdown
const deliveryStatusOptions = ref([
  { label: "All Statuses", value: null },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
]);

// Compute if any filters are active
const filterActive = computed(() => {
  return !!filters.value.month || !!filters.value.paymentStatus || !!filters.value.deliveryStatus;
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
  filters.value.paymentStatus = null;
  filters.value.deliveryStatus = null;
  loadSales();
  filterDialogVisible.value = false;
};

// Apply filters
const applyFilters = () => {
  // Reset pagination to first page when applying filters
  filters.value.page = 1;

  loadSales();
  filterDialogVisible.value = false;
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
  () => props.statusFilter,
  (newVal) => {
    // Map status filters to the appropriate query parameters
    if (newVal) {
      switch (newVal) {
        case "unpaid":
          filters.value.paymentStatus = "unpaid";
          filters.value.deliveryStatus = null;
          break;
        case "processing":
          filters.value.paymentStatus = null;
          filters.value.deliveryStatus = "processing";
          break;
        case "pendingFulfillment":
          filters.value.paymentStatus = "paid";
          filters.value.deliveryStatus = "pending";
          break;
        case "inShipping":
          filters.value.paymentStatus = null;
          filters.value.deliveryStatus = "shipped";
          break;
        case "completed":
          filters.value.paymentStatus = "paid";
          filters.value.deliveryStatus = "delivered";
          break;
        default:
          // Reset filters for "All Orders"
          filters.value.paymentStatus = null;
          filters.value.deliveryStatus = null;
          break;
      }
    } else {
      // Reset filters if no status filter
      filters.value.paymentStatus = null;
      filters.value.deliveryStatus = null;
    }

    // Reset to first page when changing tabs
    filters.value.page = 1;

    // Load data with new filters
    loadSales();
  }
);

const loadSales = async () => {
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;

    // Prepare query parameters
    const queryParams = {
      page: filters.value.page,
      limit: filters.value.limit,
    };

    // Only add search param if it's not empty
    if (filters.value.search && filters.value.search.trim() !== "") {
      queryParams.search = filters.value.search.trim();
    }

    // Add payment status filter if present
    if (filters.value.paymentStatus) {
      queryParams.paymentStatus = filters.value.paymentStatus;
    }

    // Add delivery status filter if present
    if (filters.value.deliveryStatus) {
      queryParams.deliveryStatus = filters.value.deliveryStatus;
    }

    // Add month filter - backend expects month in "YYYY-MM" format
    if (filters.value.month) {
      const date = new Date(filters.value.month);
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const year = date.getFullYear();
      queryParams.month = `${year}-${month < 10 ? "0" + month : month}`;
    }

    const response = await getSales(queryParams);

    if (response && response.data) {
      sales.value = response.data.sales || [];
      pagination.value = {
        totalItems: response.data.totalItems || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || 1,
      };
    } else {
      console.error("Unexpected sales response structure:", response);
      sales.value = [];
    }

    return response;
  } catch (error) {
    console.error("Error loading sales:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.response?.data?.message || "Failed to load sales. Please try again later.",
      life: 3000,
    });
    sales.value = [];
    return Promise.reject(error);
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer.value);
  searchDebounceTimer.value = setTimeout(() => {
    // Reset to page 1 whenever we search
    filters.value.page = 1;

    if (!loading.value) {
      loadSales().catch((error) => {
        console.error("Search error:", error);
      });
    }
  }, 500);
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
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
    detail: "Download functionality will be implemented here",
    life: 3000,
  });
};

const viewSale = (sale) => {
  emit("view", sale);
};

const confirmDelete = (sale) => {
  confirm.require({
    message: `Are you sure you want to delete this sale?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(sale.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteSale(id);

    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Sale deleted successfully",
      life: 3000,
    });

    await loadSales();
    emit("refresh", true);
  } catch (error) {
    console.error("Error deleting sale:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to delete sale",
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
      loadSales().catch((error) => {
        console.error("Auto-refresh error:", error);
      });
    }
  }, 300000); // 5 minutes refresh interval
};

// Add a direct refresh method that can be called from parent
const directRefresh = async () => {
  if (!loading.value) {
    return loadSales();
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
  loadSales();
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
  loadSales,
  startAutoRefresh,
  stopAutoRefresh,
  directRefresh,
});

// View all records
const viewAllRecords = async () => {
  try {
    isViewingAll.value = !isViewingAll.value;

    if (isViewingAll.value) {
      // When viewing all, set a high limit
      filters.value.limit = 1000;
      toast.add({
        severity: "info",
        summary: "Lihat Semua",
        detail: "Memuat seluruh data, mohon tunggu...",
        life: 3000,
      });
    } else {
      // Reset to default limit
      filters.value.limit = pageSizeOptions.value[0];
    }

    await loadSales();
  } catch (error) {
    console.error("Error toggling view all:", error);
    isViewingAll.value = false;
  }
};

// Add these utility functions to format delivery status
const formatDeliveryStatus = (status) => {
  if (!status) return "No Delivery";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getDeliveryStatusSeverity = (status) => {
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

// Status Helper Functions for Icons

// 1. Payment Status
const getPaymentStatusIcon = (sale) => {
  switch (sale.paymentStatus) {
    case "paid":
      return "pi pi-wallet text-green-500";
    case "partial":
      return "pi pi-wallet text-orange-500";
    default:
      return "pi pi-wallet text-gray-400"; // Default: unpaid
  }
};

const getPaymentStatusText = (sale) => {
  switch (sale.paymentStatus) {
    case "paid":
      return "Payment Complete";
    case "partial":
      return "Partially Paid";
    case "unpaid":
      return "Pending Payment";
    default:
      return "Payment Status Unknown";
  }
};

// 2. Processing Status
const getProcessingStatusIcon = (sale) => {
  // Considered "processing" if a delivery record exists but hasn't been shipped yet
  const hasDelivery = sale.Delivery !== null;
  const isProcessing = hasDelivery && ["pending", "processing"].includes(sale.Delivery?.status);

  if (isProcessing) return "pi pi-sync text-blue-500";
  if (hasDelivery) return "pi pi-check-circle text-green-500"; // Processed already
  return "pi pi-sync text-gray-400"; // Not yet processing
};

const getProcessingStatusText = (sale) => {
  if (!sale.Delivery) return "Not Processing";

  const status = sale.Delivery.status;
  if (status === "pending") return "Pending Processing";
  if (status === "processing") return "Currently Processing";
  return "Processing Complete";
};

// 3. Shipping Status
const getShippingStatusIcon = (sale) => {
  const isShipping = sale.Delivery && sale.Delivery.status === "shipped";
  const isDelivered = sale.Delivery && sale.Delivery.status === "delivered";

  if (isDelivered) return "pi pi-truck text-green-500"; // Delivered
  if (isShipping) return "pi pi-truck text-blue-500"; // In transit
  return "pi pi-truck text-gray-400"; // Not shipped
};

const getShippingStatusText = (sale) => {
  if (!sale.Delivery) return "Not Shipped";

  const status = sale.Delivery.status;
  if (status === "shipped") return "In Shipping";
  if (status === "delivered") return "Shipping Complete";
  return "Not Yet Shipped";
};

// 4. Completion Status
const getCompletionStatusIcon = (sale) => {
  // Order is complete when payment is received and delivery is marked as delivered
  const isPaid = sale.paymentStatus === "paid";
  const isDelivered = sale.Delivery && sale.Delivery.status === "delivered";

  if (isPaid && isDelivered) return "pi pi-check-circle text-green-500"; // Complete
  return "pi pi-check-circle text-gray-400"; // Not complete
};

const getCompletionStatusText = (sale) => {
  const isPaid = sale.paymentStatus === "paid";
  const isDelivered = sale.Delivery && sale.Delivery.status === "delivered";

  if (isPaid && isDelivered) return "Order Complete";
  if (!isPaid && !isDelivered) return "Order Incomplete";
  if (!isPaid) return "Pending Payment for Completion";
  return "Pending Delivery for Completion";
};

// Add these utility functions to format payment status and method
const formatPaymentStatus = (status) => {
  if (!status) return "Unpaid";

  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partial";
    case "unpaid":
      return "Unpaid";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const getPaymentTagSeverity = (status) => {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    case "unpaid":
      return "danger";
    default:
      return "secondary";
  }
};

const formatPaymentMethod = (method) => {
  if (!method) return "-";

  // Convert snake_case to Title Case
  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Add a ref for tracking which sale's invoice is being generated
const invoiceLoading = ref(null);

// Handle generate invoice for a sale
const handleGenerateInvoice = async (sale) => {
  try {
    console.log("Generating invoice for sale:", sale.id);
    invoiceLoading.value = sale.id;
    const response = await createInvoice({ saleId: sale.id });
    console.log("Invoice generation response:", response);

    if (response.data && response.data.invoiceNumber) {
      toast.add({
        severity: "success",
        summary: "Success",
        detail: `Invoice ${response.data.invoiceNumber} has been generated`,
        life: 3000,
      });

      // Update the sale object directly in the table
      if (!sale.Invoices) {
        sale.Invoices = [];
      }
      sale.Invoices.unshift(response.data);

      // Also reload all sales data to ensure everything is fresh
      await loadSales();
    } else {
      toast.add({
        severity: "warning",
        summary: "Warning",
        detail: "Invoice was created but no invoice number was returned",
        life: 3000,
      });
      // Reload data to get the latest state
      await loadSales();
    }
  } catch (error) {
    console.error("Error generating invoice:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to generate invoice",
      life: 3000,
    });
  } finally {
    invoiceLoading.value = null;
  }
};

// Handle view invoice PDF
const handleViewInvoice = async (invoiceId) => {
  try {
    console.log("Viewing invoice PDF for invoice ID:", invoiceId);
    if (!invoiceId) {
      console.error("No invoice ID provided");
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Invalid invoice ID",
        life: 3000,
      });
      return;
    }

    const response = await generateInvoicePDF(invoiceId);
    console.log("Invoice PDF generation response:", response);

    if (response.fileUrl) {
      // Open PDF in new window
      window.open(`http://localhost:8080${response.fileUrl}`, "_blank");
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "PDF URL not found in the response",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("Error viewing invoice:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to generate invoice PDF",
      life: 3000,
    });
  }
};
</script>

<style scoped>
/* Style for table rows */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #f8fafc;
}

:deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
  background-color: #eff6ff;
}

/* Status icon styling */
.status-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f5f5f5;
}

.status-icon {
  font-size: 14px;
}

.text-green-500 {
  color: #22c55e;
}

.text-blue-500 {
  color: #3b82f6;
}

.text-orange-500 {
  color: #f97316;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
