<template>
  <div class="operational-cost-table">
    <div class="flex justify-between gap-2 mb-4">
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search by title, description..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>
      <Button icon="pi pi-refresh" @click="loadOperationalCosts" text rounded :loading="loading" :disabled="loading" class="p-button-rounded" aria-label="Refresh data" />
    </div>

    <DataTable
      :value="costs"
      stripedRows
      :paginator="true"
      :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      :loading="loading"
      emptyMessage="No operational costs found"
      class="p-datatable-sm"
      tableStyle="min-width: 50rem"
      tableClass="p-datatable-table"
    >
      <Column field="title" header="Title" sortable style="min-width: 200px" bodyClass="p-column-title" />
      <Column field="description" header="Description" sortable style="min-width: 250px" bodyClass="p-column-title" />
      <Column field="amount" header="Amount" sortable style="min-width: 120px" bodyClass="p-column-title">
        <template #body="slotProps">
          {{ formatPrice(slotProps.data.amount) }}
        </template>
      </Column>
      <Column field="date" header="Date" sortable style="min-width: 120px" bodyClass="p-column-title">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.date) }}
        </template>
      </Column>
      <Column header="Actions" style="min-width: 120px" bodyClass="p-column-title">
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
import { useToast } from "primevue/usetoast";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import ConfirmDialog from "primevue/confirmdialog";
import { getOperationalCosts, deleteOperationalCost } from "@/services/operationalCostService";

const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "refresh"]);

const confirm = useConfirm();
const toast = useToast();
const costs = ref([]);
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

// Core data loading function
const loadOperationalCosts = async () => {
  // If already loading, don't start another request
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;
    const response = await getOperationalCosts(filters.value);

    // Update costs data
    costs.value = response.data.operationalCosts || response.data;

    // Update pagination data if available
    if (response.data.totalItems) {
      pagination.value = {
        totalItems: response.data.totalItems,
        totalPages: response.data.totalPages,
        currentPage: parseInt(response.data.currentPage),
      };
    }

    return response; // Return the response for chaining
  } catch (error) {
    console.error("Error loading operational costs:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal memuat biaya operasional",
      life: 3000,
    });
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
      loadOperationalCosts();
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
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const confirmDelete = (cost) => {
  confirm.require({
    message: `Are you sure you want to delete this operational cost: "${cost.title}"?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(cost.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;

    // Call delete API
    await deleteOperationalCost(id);

    // Show success message
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Biaya operasional berhasil dihapus",
      life: 3000,
    });

    // Force immediate data refresh
    await loadOperationalCosts();

    // Notify parent component
    emit("refresh");
  } catch (error) {
    console.error("Error deleting operational cost:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal menghapus biaya operasional",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Start auto-refresh mechanism
const startAutoRefresh = () => {
  stopAutoRefresh(); // Clear any existing timer
  refreshTimer.value = setInterval(() => {
    // Only refresh if we're not already loading data and component is mounted
    if (!loading.value && document.body.contains(document.querySelector(".operational-cost-table"))) {
      loadOperationalCosts().catch((error) => {
        console.error("Auto-refresh error:", error);
        // If auto-refresh fails, we still want to keep trying
      });
    }
  }, 500000); // 5 munite refresh interval for better responsiveness
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

// Component lifecycle hooks
onMounted(() => {
  loadOperationalCosts();
  startAutoRefresh();
});

onUnmounted(() => {
  cleanupTimers();
});

// Watch for refresh prop changes with immediate effect
watch(
  () => props.refresh,
  (newVal) => {
    if (newVal && !loading.value) {
      loadOperationalCosts().then(() => {
        emit("refresh", false);
      });
    }
  }
);

// Expose methods for parent component
defineExpose({
  loadOperationalCosts,
  startAutoRefresh,
  stopAutoRefresh,
});
</script>
