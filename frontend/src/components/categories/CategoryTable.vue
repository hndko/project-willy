<template>
  <div>
    <div class="flex justify-between gap-2 mb-4">
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search categories..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>
      <Button icon="pi pi-refresh" @click="loadCategories" text rounded :loading="loading" title="Refresh categories" />
    </div>

    <DataTable
      :value="categories"
      stripedRows
      :paginator="true"
      :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      :loading="loading"
      emptyMessage="No categories found"
      class="p-datatable-sm"
    >
      <Column field="name" header="Name" sortable style="min-width: 200px" />
      <Column field="description" header="Description" style="min-width: 300px">
        <template #body="slotProps">
          {{ slotProps.data.description || "No description provided" }}
        </template>
      </Column>
      <Column field="createdAt" header="Created At" sortable style="min-width: 150px">
        <template #body="slotProps">
          {{ new Date(slotProps.data.createdAt).toLocaleDateString() }}
        </template>
      </Column>
      <Column field="updatedAt" header="Updated At" sortable style="min-width: 150px">
        <template #body="slotProps">
          {{ new Date(slotProps.data.updatedAt).toLocaleDateString() }}
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
import { getCategories, deleteCategory } from "@/services/categoryService";

const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "refresh"]);

const confirm = useConfirm();
const categories = ref([]);
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

const loadCategories = async () => {
  // If already loading, don't start another request
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;
    const response = await getCategories(filters.value);

    console.log("Category API response:", response);

    // The response is already the data object from our service
    if (response && response.status === "Success" && Array.isArray(response.data)) {
      categories.value = response.data;

      pagination.value = {
        totalItems: categories.value.length,
        totalPages: 1,
        currentPage: 1,
      };
    } else {
      console.error("Unexpected API response format:", response);
      showApiError("Invalid data format received from server");
    }

    return response; // Return the response for chaining
  } catch (error) {
    console.error("Error loading categories:", error);
    showApiError("Failed to load categories");
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
      loadCategories();
    }
  }, 500);
};

const confirmDelete = (category) => {
  confirm.require({
    message: `Are you sure you want to delete ${category.name}?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(category.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteCategory(id);
    showSuccess("Category deleted successfully");
    // Force immediate data refresh
    await loadCategories();
    emit("refresh");
  } catch (error) {
    console.error("Error deleting category:", error);
    showApiError("Failed to delete category");
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
      loadCategories().catch((error) => {
        console.error("Auto-refresh error:", error);
        // If auto-refresh fails, we still want to keep trying
      });
    }
  }, 500000); // Reduce to 5 minute refresh interval for more responsive UI
};

// Add a direct refresh method that can be called from parent
const directRefresh = async () => {
  // Only refresh if we're not already loading
  if (!loading.value) {
    return loadCategories();
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
  loadCategories();
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
  loadCategories,
  startAutoRefresh,
  stopAutoRefresh,
  directRefresh,
});
</script>
