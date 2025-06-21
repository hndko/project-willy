<template>
  <DashboardLayout pageTitle="Stock Management">
    <!-- Product Stocks Section -->
    <Card class="mb-4 shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Product Stocks</h2>
          <Button label="Manage Stock Product" icon="pi pi-plus" @click="openStockDialog('product')" class="p-button-sm" />
        </div>
      </template>
      <template #content>
        <div class="flex flex-wrap justify-between gap-2 mb-4">
          <div class="flex gap-2">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="productFilters.search" placeholder="Search products..." class="p-inputtext-sm" @input="handleProductSearchInput" />
            </span>

            <Dropdown v-model="productFilters.type" :options="stockTypes" placeholder="Select Type" class="w-32 p-inputtext-sm" />
          </div>

          <div class="flex gap-2">
            <Button label="Apply Filters" icon="pi pi-filter" @click="loadProductStocks" class="p-button-sm p-button-outlined" />
            <Button label="Reset" icon="pi pi-refresh" @click="resetProductFilters" class="p-button-sm p-button-outlined p-button-secondary" />
          </div>
        </div>

        <DataTable :value="productStocks" :loading="productLoading" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25, 50]" tableStyle="min-width: 50rem" v-model:filters="productDtFilters" filterDisplay="menu" dataKey="id" class="p-datatable-sm">
          <Column field="type" header="Type" :sortable="true">
            <template #body="slotProps">
              <Tag :value="slotProps.data.type" :severity="getTypeSeverity(slotProps.data.type)" />
            </template>
          </Column>
          <Column field="Product.name" header="Product">
            <template #body="slotProps">
              {{ slotProps.data.Product?.name || "N/A" }}
            </template>
          </Column>
          <Column field="Product.stock" header="Current Stock">
            <template #body="slotProps">
              {{ slotProps.data.Product?.stock || 0 }}
            </template>
          </Column>
          <Column field="stock" header="Transaction Qty" :sortable="true" />
          <Column field="description" header="Description" />
          <Column field="createdAt" header="Date" :sortable="true">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>
          <Column header="Actions" :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
              <div class="flex justify-center gap-2">
                <Button icon="pi pi-pencil" @click="editStock(slotProps.data)" class="p-button-sm p-button-outlined p-button-warning" />
                <Button icon="pi pi-trash" @click="confirmDelete(slotProps.data)" class="p-button-sm p-button-outlined p-button-danger" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Raw Materials Stock Section -->
    <Card class="mb-4 shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Raw Material Stocks</h2>
          <Button label="Manage Stock Raw Material" icon="pi pi-plus" @click="openStockDialog('material')" class="p-button-sm" />
        </div>
      </template>
      <template #content>
        <div class="flex flex-wrap justify-between gap-2 mb-4">
          <div class="flex gap-2">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="materialFilters.search" placeholder="Search materials..." class="p-inputtext-sm" @input="handleMaterialSearchInput" />
            </span>

            <Dropdown v-model="materialFilters.type" :options="stockTypes" placeholder="Select Type" class="w-32 p-inputtext-sm" />
          </div>

          <div class="flex gap-2">
            <Button label="Apply Filters" icon="pi pi-filter" @click="loadMaterialStocks" class="p-button-sm p-button-outlined" />
            <Button label="Reset" icon="pi pi-refresh" @click="resetMaterialFilters" class="p-button-sm p-button-outlined p-button-secondary" />
          </div>
        </div>

        <DataTable :value="materialStocks" :loading="materialLoading" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25, 50]" tableStyle="min-width: 50rem" v-model:filters="materialDtFilters" filterDisplay="menu" dataKey="id" class="p-datatable-sm">
          <Column field="type" header="Type" :sortable="true">
            <template #body="slotProps">
              <Tag :value="slotProps.data.type" :severity="getTypeSeverity(slotProps.data.type)" />
            </template>
          </Column>
          <Column field="RawMaterial.name" header="Raw Material">
            <template #body="slotProps">
              {{ slotProps.data.RawMaterial?.name || "N/A" }}
            </template>
          </Column>
          <Column field="RawMaterial.stock" header="Current Stock">
            <template #body="slotProps">
              {{ slotProps.data.RawMaterial?.stock || 0 }}
            </template>
          </Column>
          <Column field="RawMaterial.unit" header="Unit">
            <template #body="slotProps">
              {{ slotProps.data.RawMaterial?.unit || "" }}
            </template>
          </Column>
          <Column field="stock" header="Transaction Qty" :sortable="true" />
          <Column field="description" header="Description" />
          <Column field="createdAt" header="Date" :sortable="true">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>
          <Column header="Actions" :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
              <div class="flex justify-center gap-2">
                <Button icon="pi pi-pencil" @click="editStock(slotProps.data)" class="p-button-sm p-button-outlined p-button-warning" />
                <Button icon="pi pi-trash" @click="confirmDelete(slotProps.data)" class="p-button-sm p-button-outlined p-button-danger" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Stock Dialog -->
    <StockDialog
      v-model:visible="stockDialog.visible"
      v-model:data="stockDialog.data"
      v-model:mode="stockDialog.mode"
      v-model:isEdit="stockDialog.isEdit"
      v-model:submitted="stockDialog.submitted"
      :products="products"
      :rawMaterials="rawMaterials"
      :stockTypes="stockTypes"
      @close="closeStockDialog"
    />

    <!-- Delete Confirmation -->
    <ConfirmDialog></ConfirmDialog>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch, onUnmounted } from "vue";
import { useConfirm } from "primevue/useconfirm";
import { FilterMatchMode } from "@primevue/core/api";
import { useRoute } from "vue-router";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import Textarea from "primevue/textarea";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Paginator from "primevue/paginator";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import Tag from "primevue/tag";
import StockDialog from "../../components/stock/StockDialog.vue";
import { showSuccess, showApiError } from "@/utils/toast";

import { getProducts } from "@/services/productService";
import { getRawMaterials } from "@/services/rawMaterialService";
import { getStocks, createStock, updateStock, deleteStock } from "@/services/stockService";
import { formatDate, getTypeSeverity } from "../../utils/stockUtils";

const confirm = useConfirm();
const route = useRoute();

// ====== STATE MANAGEMENT ======
// Table data and loading states
const productStocks = ref([]);
const materialStocks = ref([]);
const products = ref([]);
const rawMaterials = ref([]);

// Loading states
const productLoading = ref(false);
const materialLoading = ref(false);

// Pagination counters
const productTotalRecords = ref(0);
const materialTotalRecords = ref(0);

// Constants and options
const activeTab = ref("product");
const paginationRows = ref(10);
const stockTypes = ["in", "out", "expired", "reject"];

// For auto-refresh
const refreshTimer = ref(null);
const searchProductDebounceTimer = ref(null);
const searchMaterialDebounceTimer = ref(null);

// Filters
const productFilters = reactive({
  search: "",
  type: null,
  page: 1,
  limit: 10,
});

const materialFilters = reactive({
  search: "",
  type: null,
  page: 1,
  limit: 10,
});

// DataTable filters
const productDtFilters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const materialDtFilters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

// Dialog state
const stockDialog = reactive({
  visible: false,
  isEdit: false,
  submitted: false,
  mode: "product", // 'product' or 'material'
  data: {
    id: null,
    type: null,
    productId: null,
    rawMaterialId: null,
    stock: null,
    description: "",
  },
});

// Combined pagination state
const currentFirst = ref(0);
const currentTotalRecords = computed(() => {
  return activeTab.value === "product" ? productTotalRecords.value : materialTotalRecords.value;
});

// ====== DATA LOADING FUNCTIONS ======
const loadProductStocks = async () => {
  // If already loading, don't start another request
  if (productLoading.value) return Promise.resolve();

  try {
    productLoading.value = true;
    activeTab.value = "product"; // Set active tab when loading products

    const response = await getStocks({
      search: productFilters.search,
      type: productFilters.type,
      page: productFilters.page,
      limit: productFilters.limit,
      entityType: "product",
    });

    // Filter duplikat berdasarkan id
    const uniqueStocks = [];
    const seenIds = new Set();
    for (const stock of response.data.stocks) {
      if (!seenIds.has(stock.id)) {
        uniqueStocks.push(stock);
        seenIds.add(stock.id);
      }
    }
    productStocks.value = uniqueStocks.filter((stock) => stock.productId);
    productTotalRecords.value = response.data.totalItems;

    return response;
  } catch (error) {
    handleApiError("Failed to load product stocks", error);
    return Promise.reject(error);
  } finally {
    productLoading.value = false;
  }
};

const loadMaterialStocks = async () => {
  // If already loading, don't start another request
  if (materialLoading.value) return Promise.resolve();

  try {
    materialLoading.value = true;
    activeTab.value = "material"; // Set active tab when loading materials

    const response = await getStocks({
      search: materialFilters.search,
      type: materialFilters.type,
      page: materialFilters.page,
      limit: materialFilters.limit,
      entityType: "material",
    });

    materialStocks.value = response.data.stocks.filter((stock) => stock.rawMaterialId);
    materialTotalRecords.value = response.data.totalItems;

    return response;
  } catch (error) {
    handleApiError("Failed to load material stocks", error);
    return Promise.reject(error);
  } finally {
    materialLoading.value = false;
  }
};

const loadProducts = async () => {
  try {
    const response = await getProducts({ limit: 100 });
    products.value = response.data.products;
  } catch (error) {
    handleApiError("Failed to load products", error);
  }
};

const loadRawMaterials = async () => {
  try {
    const response = await getRawMaterials({ limit: 100 });
    rawMaterials.value = response.data.rawMaterials;
  } catch (error) {
    handleApiError("Failed to load raw materials", error);
  }
};

// ====== EVENT HANDLERS ======
// Debounced search input handlers
const handleProductSearchInput = () => {
  clearTimeout(searchProductDebounceTimer.value);
  searchProductDebounceTimer.value = setTimeout(() => {
    if (!productLoading.value) {
      loadProductStocks();
    }
  }, 500);
};

const handleMaterialSearchInput = () => {
  clearTimeout(searchMaterialDebounceTimer.value);
  searchMaterialDebounceTimer.value = setTimeout(() => {
    if (!materialLoading.value) {
      loadMaterialStocks();
    }
  }, 500);
};

// Filter reset handlers
const resetProductFilters = () => {
  productFilters.search = "";
  productFilters.type = null;
  productFilters.page = 1;
  currentFirst.value = 0;
  loadProductStocks();
};

const resetMaterialFilters = () => {
  materialFilters.search = "";
  materialFilters.type = null;
  materialFilters.page = 1;
  currentFirst.value = 0;
  loadMaterialStocks();
};

// Combined page change handler
const onPageChange = (event) => {
  paginationRows.value = event.rows;

  if (activeTab.value === "product") {
    productFilters.page = event.page + 1;
    productFilters.limit = event.rows;
    loadProductStocks();
  } else {
    materialFilters.page = event.page + 1;
    materialFilters.limit = event.rows;
    loadMaterialStocks();
  }

  currentFirst.value = event.first;
};

// ====== DIALOG HANDLERS ======
const openStockDialog = (mode) => {
  stockDialog.isEdit = false;
  stockDialog.submitted = false;
  stockDialog.mode = mode;
  stockDialog.data = {
    id: null,
    type: null,
    productId: null,
    rawMaterialId: null,
    stock: null,
    description: "",
  };
  stockDialog.visible = true;
};

const editStock = (stock) => {
  stockDialog.isEdit = true;
  stockDialog.submitted = false;
  stockDialog.mode = stock.productId ? "product" : "material";
  stockDialog.data = {
    id: stock.id,
    type: stock.type,
    productId: stock.productId,
    rawMaterialId: stock.rawMaterialId,
    stock: stock.stock,
    description: stock.description,
  };
  stockDialog.visible = true;
};

const closeStockDialog = () => {
  stockDialog.visible = false;
  stockDialog.submitted = false;
};

const saveStock = async () => {
  stockDialog.submitted = true;

  // Validation
  if (!stockDialog.data.type || !stockDialog.data.stock) {
    return;
  }

  if (stockDialog.mode === "product" && !stockDialog.data.productId) {
    return;
  }

  if (stockDialog.mode === "material" && !stockDialog.data.rawMaterialId) {
    return;
  }

  try {
    if (stockDialog.isEdit) {
      await updateStock(stockDialog.data.id, stockDialog.data);
      showSuccess("Stock updated successfully");
    } else {
      await createStock(stockDialog.data);
      showSuccess("Stock created successfully");
    }

    closeStockDialog();
    // Setelah close dialog, langsung refresh data sesuai mode
    if (stockDialog.mode === "product") {
      await loadProductStocks();
    } else {
      await loadMaterialStocks();
    }
  } catch (error) {
    handleApiError(error.response?.data?.message || "Operation failed", error);
  }
};

const confirmDelete = (stock) => {
  confirm.require({
    message: "Are you sure you want to delete this stock entry?",
    header: "Confirm Delete",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => {
      handleDelete(stock.id, stock.productId ? "product" : "material");
    },
  });
};

const handleDelete = async (id, mode) => {
  try {
    await deleteStock(id);
    showSuccess("Stock deleted successfully");

    // Refresh the appropriate table
    if (mode === "product") {
      loadProductStocks();
    } else {
      loadMaterialStocks();
    }
  } catch (error) {
    handleApiError("Failed to delete stock", error);
  }
};

// ====== AUTO-REFRESH FUNCTIONALITY ======
// Start auto-refresh mechanism
const startAutoRefresh = () => {
  stopAutoRefresh(); // Clear any existing timer
  refreshTimer.value = setInterval(() => {
    // Only refresh if not already loading data and component is mounted
    if (document.body.contains(document.querySelector(".p-datatable"))) {
      if (!productLoading.value) {
        loadProductStocks().catch((error) => {
          console.error("Auto-refresh product stocks error:", error);
        });
      }

      if (!materialLoading.value) {
        loadMaterialStocks().catch((error) => {
          console.error("Auto-refresh material stocks error:", error);
        });
      }
    }
  }, 500000); // 5 Minute refresh interval
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
  if (searchProductDebounceTimer.value) {
    clearTimeout(searchProductDebounceTimer.value);
  }
  if (searchMaterialDebounceTimer.value) {
    clearTimeout(searchMaterialDebounceTimer.value);
  }
};

// ====== UTILITY FUNCTIONS ======
// Error handler
const handleApiError = (message, error) => {
  console.error(`${message}:`, error);
  showApiError(message, error);
};

// Tab changes tracking
watch(activeTab, (newTab) => {
  currentFirst.value = newTab === "product" ? (productFilters.page - 1) * productFilters.limit : (materialFilters.page - 1) * materialFilters.limit;
  paginationRows.value = newTab === "product" ? productFilters.limit : materialFilters.limit;
});

// ====== LIFECYCLE HOOKS ======
onMounted(() => {
  loadProductStocks();
  loadMaterialStocks();
  loadProducts();
  loadRawMaterials();
  startAutoRefresh();

  // Handle query parameters
  if (route.query.action === "new") {
    // Default to product stock, but could be more specific with another query param
    openStockDialog("product");
  }
});

watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.action === "new") {
      openStockDialog("product");
    }
  },
  { deep: true }
);

onUnmounted(() => {
  cleanupTimers();
});
</script>
