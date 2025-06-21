<template>
  <div>
    <div class="flex justify-between gap-2 mb-4">
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search raw materials..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>
      <Button icon="pi pi-refresh" @click="loadRawMaterials" text rounded :loading="loading" title="Refresh raw materials" />
    </div>

    <DataTable
      :value="rawMaterials"
      stripedRows
      :paginator="true"
      :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      :loading="loading"
      emptyMessage="No raw materials found"
      class="p-datatable-sm"
    >
      <Column field="name" header="Name" sortable style="min-width: 200px" />
      <Column field="stock" header="Stock" sortable style="min-width: 100px" />
      <Column field="unit" header="Unit" sortable style="min-width: 120px" />
      <Column field="price" header="Price" sortable style="min-width: 120px">
        <template #body="slotProps">
          {{ formatPrice(slotProps.data.price) }}
        </template>
      </Column>
      <Column field="is_active" header="Status" sortable style="min-width: 100px">
        <template #body="slotProps">
          <Tag :severity="slotProps.data.is_active ? 'success' : 'danger'" :value="slotProps.data.is_active ? 'Active' : 'Inactive'" />
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
import Tag from "primevue/tag";
import ConfirmDialog from "primevue/confirmdialog";
import { getRawMaterials, deleteRawMaterial } from "@/services/rawMaterialService";

const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "refresh"]);

const confirm = useConfirm();
const rawMaterials = ref([]);
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

const loadRawMaterials = async () => {
  // If already loading, don't start another request
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;
    const response = await getRawMaterials(filters.value);
    rawMaterials.value = response.data.rawMaterials;
    pagination.value = {
      totalItems: response.data.totalItems,
      totalPages: response.data.totalPages,
      currentPage: response.data.currentPage,
    };

    return response; // Return the response for chaining
  } catch (error) {
    console.error("Error loading raw materials:", error);
    showApiError("Failed to load raw materials");
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
      loadRawMaterials();
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

const confirmDelete = (material) => {
  confirm.require({
    message: `Are you sure you want to delete ${material.name}?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(material.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteRawMaterial(id);
    showSuccess("Raw Material deleted successfully");
    // Force immediate data refresh
    await loadRawMaterials();
    emit("refresh");
  } catch (error) {
    console.error("Error deleting raw material:", error);
    showApiError("Failed to delete raw material");
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
      loadRawMaterials().catch((error) => {
        console.error("Auto-refresh error:", error);
        // If auto-refresh fails, we still want to keep trying
      });
    }
  }, 500000); // Reduce to 1 minute refresh interval for more responsive UI
};

// Add a direct refresh method that can be called from parent
const directRefresh = async () => {
  // Only refresh if we're not already loading
  if (!loading.value) {
    return loadRawMaterials();
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
  loadRawMaterials();
  startAutoRefresh();
});

onUnmounted(() => {
  cleanupTimers();
});

// Watch for refresh prop changes - optimize to use directRefresh
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
  loadRawMaterials,
  startAutoRefresh,
  stopAutoRefresh,
  directRefresh,
});
</script>
