<template>
  <div>
    <div class="flex justify-between gap-2 mb-4">
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search by invoice number or customer..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>
      <div class="flex gap-2">
        <Button icon="pi pi-filter" @click="toggleFilterPanel" :class="{ 'p-button-outlined p-button-info': filterActive }" text rounded title="Filter" />
        <Button icon="pi pi-download" @click="handleDownload" text rounded title="Download" />
        <Button icon="pi pi-refresh" @click="loadInvoices" text rounded :loading="loading" title="Refresh invoices" />
      </div>
    </div>

    <DataTable
      :value="invoices"
      stripedRows
      :paginator="true"
      :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      :loading="loading"
      emptyMessage="No invoices found"
      class="p-datatable-sm"
    >
      <Column field="invoiceNumber" header="Invoice Number" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          <span class="font-medium text-blue-600">{{ slotProps.data.invoiceNumber }}</span>
        </template>
      </Column>
      <Column field="Customer.name" header="Customer" :sortable="true" style="min-width: 180px">
        <template #body="slotProps">
          {{ slotProps.data.Customer ? slotProps.data.Customer.name : "-" }}
        </template>
      </Column>
      <Column field="User.name" header="Issued By" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          {{ slotProps.data.User ? slotProps.data.User.name : "-" }}
        </template>
      </Column>
      <Column field="date" header="Date" :sortable="true" style="min-width: 120px">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.date) }}
        </template>
      </Column>
      <Column field="total" header="Total" :sortable="true" style="min-width: 120px">
        <template #body="slotProps">
          {{ formatPrice(slotProps.data.total) }}
        </template>
      </Column>
      <Column field="paymentStatus" header="Payment Status" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          <Tag :severity="getPaymentStatusSeverity(slotProps.data.paymentStatus)" :value="formatPaymentStatus(slotProps.data.paymentStatus)" />
        </template>
      </Column>
      <Column field="paymentMethod" header="Payment Method" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          <span v-if="slotProps.data.paymentMethod">{{ slotProps.data.paymentMethod }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </Column>
      <Column field="paymentDate" header="Payment Date" :sortable="true" style="min-width: 150px">
        <template #body="slotProps">
          <span v-if="slotProps.data.paymentDate">{{ formatDate(slotProps.data.paymentDate) }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </Column>
      <Column header="Actions" style="min-width: 200px">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button icon="pi pi-wallet" severity="warning" text rounded @click="openPaymentDialog(slotProps.data)" aria-label="Update Payment" v-tooltip.top="'Update Payment'" />
            <Button icon="pi pi-file-pdf" severity="info" text rounded @click="generatePDF(slotProps.data)" aria-label="Generate PDF" v-tooltip.top="'Generate PDF'" />
            <Button icon="pi pi-eye" severity="info" text rounded @click="$emit('edit', slotProps.data)" aria-label="View Details" v-tooltip.top="'View Details'" />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(slotProps.data)" aria-label="Delete" v-tooltip.top="'Delete'" />
          </div>
        </template>
      </Column>
    </DataTable>

    <ConfirmDialog></ConfirmDialog>

    <!-- Payment Dialog -->
    <Dialog v-model:visible="paymentDialogVisible" header="Update Payment Status" :style="{ width: '500px' }" :modal="true">
      <InvoicePaymentForm :invoice="selectedInvoice" @save="handlePaymentSaved" @cancel="closePaymentDialog" />
    </Dialog>

    <!-- Filter Dialog -->
    <Dialog v-model:visible="filterDialogVisible" header="Filter Invoices" :style="{ width: '450px' }" :modal="true">
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
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Clear Filters" @click="clearFilters" outlined />
          <Button label="Apply" @click="applyFilters" />
        </div>
      </template>
    </Dialog>
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
import ConfirmDialog from "primevue/confirmdialog";
import Dialog from "primevue/dialog";
import Tag from "primevue/tag";
import Calendar from "primevue/calendar";
import Dropdown from "primevue/dropdown";
import { getInvoices, deleteInvoice, generateInvoicePDF } from "@/services/invoiceService";
import { format, startOfMonth, endOfMonth } from "date-fns";
import InvoicePaymentForm from "./InvoicePaymentForm.vue";

const props = defineProps({
  paymentFilter: {
    type: String,
    default: "",
  },
  refresh: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "refresh"]);

const confirm = useConfirm();
const invoices = ref([]);
const loading = ref(false);
const filters = ref({
  search: "",
  page: 1,
  limit: 10,
  paymentStatus: props.paymentFilter,
  month: null,
});

// For dialogs
const paymentDialogVisible = ref(false);
const selectedInvoice = ref({});

// For auto-refresh and debounce
const refreshTimer = ref(null);
const searchDebounceTimer = ref(null);

const pagination = ref({
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
});

// Filter dialog related
const filterDialogVisible = ref(false);
const paymentStatusOptions = ref([
  { label: "All Statuses", value: null },
  { label: "Paid", value: "paid" },
  { label: "Partially Paid", value: "partial" },
  { label: "Unpaid", value: "unpaid" },
]);

// Compute if any filters are active
const filterActive = computed(() => {
  return !!filters.value.month || (!!filters.value.paymentStatus && filters.value.paymentStatus !== props.paymentFilter);
});

// Watch for payment filter changes
watch(
  () => props.paymentFilter,
  (newValue) => {
    filters.value.paymentStatus = newValue;
    loadInvoices();
  }
);

const loadInvoices = async () => {
  // If already loading, don't start another request
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;

    // Prepare query parameters
    const queryParams = {
      page: filters.value.page,
      limit: filters.value.limit,
    };

    // Add search param if it's not empty
    if (filters.value.search && filters.value.search.trim() !== "") {
      queryParams.search = filters.value.search.trim();
    }

    // Add payment status filter if present
    if (filters.value.paymentStatus) {
      queryParams.paymentStatus = filters.value.paymentStatus;
    }

    // Add month filter in YYYY-MM format
    if (filters.value.month) {
      const date = new Date(filters.value.month);
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const year = date.getFullYear();
      queryParams.month = `${year}-${month < 10 ? "0" + month : month}`;
    }

    console.log("Loading invoices with filters:", queryParams);
    const response = await getInvoices(queryParams);
    console.log("Invoices API response:", response);

    if (response.data) {
      invoices.value = response.data;
      console.log("Loaded invoices:", invoices.value);

      if (response.totalData) {
        pagination.value = {
          totalItems: response.totalData,
          totalPages: response.totalPages,
          currentPage: response.currentPage,
        };
        console.log("Pagination info:", pagination.value);
      }
    } else {
      console.error("Unexpected invoices response structure:", response);
      invoices.value = [];
    }

    return response; // Return the response for chaining
  } catch (error) {
    console.error("Error loading invoices:", error);
    showApiError("Failed to load invoices");
    return Promise.reject(error);
  } finally {
    loading.value = false;
  }
};

// Open payment dialog
const openPaymentDialog = (invoice) => {
  selectedInvoice.value = invoice;
  paymentDialogVisible.value = true;
};

// Close payment dialog
const closePaymentDialog = () => {
  paymentDialogVisible.value = false;
};

// Handle payment saved
const handlePaymentSaved = () => {
  closePaymentDialog();
  loadInvoices();
  emit("refresh", true);
};

// Debounced search input handler with loading state handling
const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer.value);
  searchDebounceTimer.value = setTimeout(() => {
    if (!loading.value) {
      loadInvoices();
    }
  }, 500);
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    return dateString;
  }
};

const formatPaymentStatus = (status) => {
  if (!status) return "Unpaid";
  const statusMap = {
    unpaid: "Unpaid",
    partial: "Partial",
    paid: "Paid",
  };
  return statusMap[status] || status;
};

const getPaymentStatusSeverity = (status) => {
  const severityMap = {
    unpaid: "danger",
    partial: "warning",
    paid: "success",
  };
  return severityMap[status] || "info";
};

// Toggle filter dialog
const toggleFilterPanel = () => {
  filterDialogVisible.value = !filterDialogVisible.value;
};

// Clear filters
const clearFilters = () => {
  filters.value.month = null;
  filters.value.paymentStatus = props.paymentFilter;
  loadInvoices();
  filterDialogVisible.value = false;
};

// Apply filters
const applyFilters = () => {
  // Reset pagination to first page when applying filters
  filters.value.page = 1;

  // Format month for backend if it exists
  if (filters.value.month) {
    const date = new Date(filters.value.month);
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();
    filters.value.monthQuery = `${year}-${month < 10 ? "0" + month : month}`;
  } else {
    filters.value.monthQuery = null;
  }

  loadInvoices();
  filterDialogVisible.value = false;
};

const handleDownload = () => {
  try {
    // Get data to export
    const dataToExport = invoices.value.map((invoice) => ({
      "Invoice Number": invoice.invoiceNumber,
      Customer: invoice.Customer?.name || "-",
      "Issued By": invoice.User?.name || "-",
      Date: formatDate(invoice.date),
      Total: formatPrice(invoice.total),
      "Payment Status": formatPaymentStatus(invoice.paymentStatus),
      "Payment Method": invoice.paymentMethod || "-",
      "Payment Date": invoice.paymentDate ? formatDate(invoice.paymentDate) : "-",
    }));

    if (dataToExport.length === 0) {
      showApiError("There is no data to export");
      return;
    }

    // Convert to CSV
    const headers = Object.keys(dataToExport[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(","));

    // Add data rows
    for (const row of dataToExport) {
      const values = headers.map((header) => {
        const value = row[header] || "";
        // Escape quotes and handle commas
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    // Combine into a single string
    const csvString = csvRows.join("\n");

    // Create a blob and download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess("Invoices exported successfully");
  } catch (error) {
    console.error("Error exporting invoices:", error);
    showApiError("Failed to export invoices");
  }
};

const confirmDelete = (invoice) => {
  confirm.require({
    message: `Are you sure you want to delete this invoice?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(invoice.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteInvoice(id);
    showSuccess("Invoice deleted successfully");

    // Force immediate data refresh
    await loadInvoices();

    // Signal the parent component to reset the refresh trigger
    emit("refresh", true);
  } catch (error) {
    console.error("Error deleting invoice:", error);
    showApiError("Failed to delete invoice");
  } finally {
    loading.value = false;
  }
};

const generatePDF = async (invoice) => {
  try {
    loading.value = true;
    const response = await generateInvoicePDF(invoice.id);

    if (response.fileUrl) {
      // Open PDF in new window
      window.open(`http://localhost:8080${response.fileUrl}`, "_blank");

      showSuccess("Invoice PDF generated successfully");
    }
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    showApiError("Failed to generate invoice PDF");
  } finally {
    loading.value = false;
  }
};

// Start auto-refresh mechanism
const startAutoRefresh = () => {
  stopAutoRefresh(); // Clear any existing timer
  refreshTimer.value = setInterval(() => {
    // Only refresh if we're not already loading data
    if (!loading.value) {
      loadInvoices().catch((error) => {
        console.error("Auto-refresh error:", error);
      });
    }
  }, 500000); // 5 minutes refresh interval
};

// Add a direct refresh method that can be called from parent
const directRefresh = async () => {
  // Only refresh if we're not already loading
  if (!loading.value) {
    return loadInvoices();
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
  loadInvoices();
  startAutoRefresh();
});

onUnmounted(() => {
  cleanupTimers();
});

// Watch for refresh prop changes
watch(
  () => props.refresh,
  (newVal, oldVal) => {
    if (newVal === true) {
      directRefresh()
        .then(() => {
          emit("refresh", false);
        })
        .catch((error) => {
          console.error("Error during refresh:", error);
          // Still reset the refresh prop even if there's an error
          emit("refresh", false);
        });
    }
  }
);

// Expose methods for parent component
defineExpose({
  loadInvoices,
  startAutoRefresh,
  stopAutoRefresh,
  directRefresh,
});
</script>
