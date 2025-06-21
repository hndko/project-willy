<template>
  <div>
    <div class="flex justify-between gap-2 mb-4">
      <div class="relative w-full md:w-80">
        <InputText v-model="filters.search" placeholder="Search products..." class="w-full pl-10" @input="handleSearchInput" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>
      <Button icon="pi pi-refresh" @click="loadProducts" text rounded :loading="loading" title="Refresh products" />
    </div>

    <DataTable
      :value="products"
      stripedRows
      :paginator="true"
      :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      responsiveLayout="scroll"
      :loading="loading"
      emptyMessage="No products found"
      class="p-datatable-sm"
    >
      <Column header="Image" style="min-width: 100px">
        <template #body="slotProps">
          <img :src="getProductImage(slotProps.data.image)" :alt="slotProps.data.name" @error="onImageError" class="object-cover w-12 h-12 rounded-md shadow-sm" />
        </template>
      </Column>
      <Column field="sku" header="SKU" sortable style="min-width: 100px" />
      <Column field="name" header="Name" sortable style="min-width: 200px" />
      <Column field="price" header="Price" sortable style="min-width: 120px">
        <template #body="slotProps">
          {{ formatPrice(slotProps.data.price) }}
        </template>
      </Column>
      <Column field="stock" header="Stock" sortable style="min-width: 100px" />
      <Column field="Category.name" header="Category" sortable style="min-width: 150px" />
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
import { getProducts, deleteProduct } from "@/services/productService";

const props = defineProps({
  refreshKey: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["edit", "refresh"]);

const confirm = useConfirm();
const products = ref([]);
const loading = ref(false);
const filters = ref({
  search: "",
  page: 1,
  limit: 10,
});

// Handler image error
const onImageError = (event) => {
  event.target.src = "/images/default-profile.png";
};

// Helper untuk menentukan src gambar
const getProductImage = (image) => {
  if (!image || image === "null" || image === null) {
    return "/images/default-profile.png";
  }
  return `/uploads/${image}`;
};

const pagination = ref({
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
});

const loadProducts = async () => {
  // If already loading, don't start another request
  if (loading.value) return Promise.resolve();

  try {
    loading.value = true;
    const response = await getProducts(filters.value);
    products.value = response.data.products;
    pagination.value = {
      totalItems: response.data.totalItems,
      totalPages: response.data.totalPages,
      currentPage: response.data.currentPage,
    };

    return response; // Return the response for chaining
  } catch (error) {
    console.error("Error loading products:", error);
    showApiError("Failed to load products");
    return Promise.reject(error);
  } finally {
    loading.value = false;
  }
};

// Debounced search input handler with loading state handling
const handleSearchInput = () => {
  if (!loading.value) {
    loadProducts();
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

const confirmDelete = (product) => {
  confirm.require({
    message: `Are you sure you want to delete ${product.name}?`,
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => handleDelete(product.id),
  });
};

const handleDelete = async (id) => {
  try {
    loading.value = true;
    await deleteProduct(id);
    showSuccess("Produk berhasil dihapus");
    // Force immediate data refresh
    await loadProducts();
    emit("refresh");
  } catch (err) {
    showApiError("Gagal menghapus produk");
  } finally {
    loading.value = false;
  }
};

// Watch for refreshKey changes to reload products
watch(
  () => props.refreshKey,
  () => {
    loadProducts();
  }
);

onMounted(() => {
  loadProducts();
});

onUnmounted(() => {
  // Cleanup code if needed
});

// Expose only loadProducts for parent
defineExpose({
  loadProducts,
});
</script>
