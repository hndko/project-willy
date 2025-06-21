<template>
  <div>
    <div class="flex justify-between gap-2 mb-4">
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search customers..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>
      <Button icon="pi pi-refresh" @click="loadCustomers" text rounded :loading="loading" title="Refresh customers" />
    </div>

    <DataTable
      :value="customers"
      stripedRows
      :paginator="true"
      :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      :loading="loading"
      emptyMessage="No customers found"
      class="p-datatable-sm"
    >
      <Column field="name" header="Name" sortable style="min-width: 200px" />
      <Column field="email" header="Email" style="min-width: 200px" />
      <Column field="phone" header="Phone" style="min-width: 150px" />
      <Column field="address" header="Address" style="min-width: 250px" />
      <Column field="description" header="Description" style="min-width: 200px">
        <template #body="slotProps">
          <span v-if="slotProps.data.description">{{ slotProps.data.description }}</span>
          <span v-else class="text-gray-400">No description</span>
        </template>
      </Column>
      <Column field="createdAt" header="Created At" sortable style="min-width: 150px">
        <template #body="slotProps">
          {{ new Date(slotProps.data.createdAt).toLocaleDateString() }}
        </template>
      </Column>
      <Column header="Actions" style="min-width: 150px">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" severity="info" text rounded @click="$emit('edit', slotProps.data)" aria-label="Edit" />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(slotProps.data)" aria-label="Delete" />
          </div>
        </template>
      </Column>
    </DataTable>

    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from "vue";
import { useConfirm } from "primevue/useconfirm";
import { showSuccess, showApiError } from "@/utils/toast";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import ConfirmDialog from "primevue/confirmdialog";
import { getCustomers, deleteCustomer } from "@/services/customerService";

const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "refresh"]);

const confirm = useConfirm();
const customers = ref([]);
const loading = ref(false);
const filters = ref({
  search: "",
  page: 1,
  limit: 10,
});

// For auto-refresh
const refreshTimer = ref(null);
const searchDebounceTimer = ref(null);

const pagination = ref({
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
});

const loadCustomers = async () => {
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;
    const response = await getCustomers(filters.value);

    if (response && response.status === "Success") {
      customers.value = response.data.customers || [];

      pagination.value = {
        totalItems: response.data.totalItems || 0,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
      };
    } else {
      console.error("Unexpected API response format:", response);
      showApiError("Invalid data format received from server");
    }

    return response;
  } catch (error) {
    console.error("Error loading customers:", error);
    showApiError("Failed to load customers");
    return Promise.reject(error);
  } finally {
    loading.value = false;
  }
};

// Debounced search input handler
const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer.value);
  searchDebounceTimer.value = setTimeout(() => {
    if (!loading.value) {
      loadCustomers();
    }
  }, 500);
};

const confirmDelete = (customer) => {
  confirm.require({
    message: `Are you sure you want to delete ${customer.name}?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(customer.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteCustomer(id);
    showSuccess("Customer deleted successfully");
    // Force immediate data refresh
    await loadCustomers();
    emit("refresh");
  } catch (error) {
    console.error("Error deleting customer:", error);
    showApiError(error.response?.data?.message || "Failed to delete customer");
  } finally {
    loading.value = false;
  }
};

// Auto-refresh management
const startAutoRefresh = () => {
  stopAutoRefresh();
  refreshTimer.value = setInterval(() => {
    if (!loading.value) {
      loadCustomers().catch((error) => {
        console.error("Auto-refresh error:", error);
      });
    }
  }, 300000); // Refresh every 5 minutes
};

const directRefresh = async () => {
  if (!loading.value) {
    return loadCustomers();
  }
  return Promise.resolve();
};

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

const cleanupTimers = () => {
  stopAutoRefresh();
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
};

onMounted(() => {
  loadCustomers();
  startAutoRefresh();
});

onUnmounted(() => {
  cleanupTimers();
});

// Watch for refresh prop changes
watch(
  () => props.refresh,
  (newVal) => {
    if (newVal && !loading.value) {
      directRefresh().then(() => {
        emit("refresh", false);
      });
    }
  }
);

// Expose methods for parent component
defineExpose({
  loadCustomers,
  startAutoRefresh,
  stopAutoRefresh,
  directRefresh,
});
</script>
