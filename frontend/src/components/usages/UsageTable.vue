<template>
  <div>
    <div class="flex justify-between gap-2 mb-4">
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search usages..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>
      <Button icon="pi pi-refresh" @click="loadUsages" text rounded :loading="loading" title="Refresh usages" />
    </div>

    <DataTable
      :value="usages"
      stripedRows
      :paginator="true"
      :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      :loading="loading"
      emptyMessage="No usages found"
      class="p-datatable-sm"
    >
      <Column field="rawMaterial.name" header="Raw Material" sortable style="min-width: 200px">
        <template #body="slotProps">
          {{ slotProps.data.RawMaterial ? slotProps.data.RawMaterial.name : "N/A" }}
        </template>
      </Column>
      <Column field="qty" header="Quantity" sortable style="min-width: 120px" />
      <Column field="rawMaterial.unit" header="Unit" sortable style="min-width: 80px">
        <template #body="slotProps">
          {{ slotProps.data.RawMaterial ? slotProps.data.RawMaterial.unit : "-" }}
        </template>
      </Column>
      <Column field="description" header="Description" sortable style="min-width: 200px">
        <template #body="slotProps">
          {{ slotProps.data.description || "-" }}
        </template>
      </Column>
      <Column field="user.name" header="Created By" sortable style="min-width: 200px">
        <template #body="slotProps">
          {{ slotProps.data.User ? slotProps.data.User.name : "N/A" }}
        </template>
      </Column>
      <Column field="date" header="Date" sortable style="min-width: 150px">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.date) }}
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
import { getUsages, deleteUsage } from "@/services/usageService";
import { format } from "date-fns";

const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "refresh"]);

const confirm = useConfirm();
const usages = ref([]);
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

const loadUsages = async () => {
  // If already loading, don't start another request
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;
    const response = await getUsages(filters.value);
    usages.value = response.data.usages;
    pagination.value = {
      totalItems: response.data.totalItems,
      totalPages: response.data.totalPages,
      currentPage: response.data.currentPage,
    };

    return response; // Return the response for chaining
  } catch (error) {
    console.error("Error loading usages:", error);
    showApiError("Failed to load usages");
    return Promise.reject(error);
  } finally {
    loading.value = false;
  }
};

// Debounced search input handler with loading state handling
const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer.value);
  searchDebounceTimer.value = setTimeout(() => {
    if (!loading.value) {
      loadUsages();
    }
  }, 500);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    return dateString;
  }
};

const confirmDelete = (usageItem) => {
  confirm.require({
    message: `Are you sure you want to delete this usage record?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(usageItem.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteUsage(id);
    showSuccess("Usage deleted successfully");
    // Force immediate data refresh
    await loadUsages();
    emit("refresh");
  } catch (error) {
    console.error("Error deleting usage:", error);
    showApiError("Failed to delete usage record");
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
      loadUsages().catch((error) => {
        console.error("Auto-refresh error:", error);
      });
    }
  }, 500000); // Refresh interval (in milliseconds)
};

// Add a direct refresh method that can be called from parent
const directRefresh = async () => {
  // Only refresh if we're not already loading
  if (!loading.value) {
    return loadUsages();
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
  loadUsages();
  startAutoRefresh();
});

onUnmounted(() => {
  cleanupTimers();
});

// Watch for refresh prop changes - optimize to use directRefresh
watch(
  () => props.refresh,
  (newVal) => {
    if (newVal) {
      // Langsung refresh data tanpa menunggu
      directRefresh();
      // Tidak perlu mengembalikan nilai false, parent component akan melakukannya
    }
  },
  { immediate: false } // Jalankan hanya saat nilai berubah
);

// Expose methods for parent component
defineExpose({
  loadUsages,
  startAutoRefresh,
  stopAutoRefresh,
  directRefresh,
});
</script>
