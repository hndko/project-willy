<template>
  <DashboardLayout pageTitle="BoM Management">
    <div class="flex items-center mb-4">
      <InputText v-model="search" placeholder="Search by product name..." class="w-1/3" @input="onSearch" />
    </div>
    <div class="space-y-6">
      <Card v-for="product in pagedProducts" :key="product.id" class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-2">
            <span class="text-lg font-bold">{{ product.name }}</span>
            <Button label="Add BoM" icon="pi pi-plus" @click="openAddDialog(product)" />
          </div>
        </template>
        <template #content>
          <DataTable :value="product.BoMs" class="p-datatable-sm" :emptyMessage="'No BoM for this product'">
            <Column field="RawMaterial.name" header="Bahan Baku">
              <template #body="{ data }">
                {{ data.RawMaterial?.name || "-" }}
              </template>
            </Column>
            <Column field="qty" header="Qty" />
            <Column field="unit" header="Satuan">
              <template #body="{ data }">
                {{ data.unit || data.RawMaterial?.unit || "-" }}
              </template>
            </Column>
            <Column header="Aksi" style="width: 100px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button icon="pi pi-pencil" class="p-button-sm p-button-text text-primary" @click="openEditDialog(product, data)" />
                  <Button icon="pi pi-trash" class="text-red-500 p-button-sm p-button-text" @click="openDeleteDialog(product, data)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
    <div class="flex items-center justify-between mt-6">
      <span class="text-sm text-gray-500">Showing {{ startIdx + 1 }} to {{ endIdx }} of {{ filteredProducts.length }} products</span>
      <Paginator :rows="rows" :totalRecords="filteredProducts.length" :first="(page - 1) * rows" @page="onPageChange" :rowsPerPageOptions="[5, 10, 20, 50]" />
    </div>
    <Dialog v-model:visible="showForm" :header="editMode ? 'Edit BoM' : 'Add BoM'" :style="{ width: '400px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <BoMForm :bom="selectedBoM" :editMode="editMode" :productId="selectedProductId" :productName="selectedProductName" @close="closeDialog" @saved="handleSave" />
    </Dialog>
    <ConfirmDialog />
    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Toast from "primevue/toast";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import Paginator from "primevue/paginator";
import BoMForm from "@/components/boms/BoMForm.vue";
import { getBoMsGroupedByProduct, createBoM, updateBoM, deleteBoM } from "@/services/bomService";
import { showSuccess, showApiError } from "@/utils/toast";

const products = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editMode = ref(false);
const selectedBoM = ref(null);
const selectedProductId = ref(null);
const selectedProductName = ref("");
const search = ref("");
const page = ref(1);
const rows = ref(5);

const filteredProducts = computed(() => {
  if (!search.value) return products.value;
  return products.value.filter((p) => p.name.toLowerCase().includes(search.value.toLowerCase()));
});

const pagedProducts = computed(() => {
  const start = (page.value - 1) * rows.value;
  return filteredProducts.value.slice(start, start + rows.value);
});

const startIdx = computed(() => (page.value - 1) * rows.value);
const endIdx = computed(() => Math.min(page.value * rows.value, filteredProducts.value.length));

const onSearch = () => {
  page.value = 1;
};

const onPageChange = (event) => {
  page.value = event.page + 1;
  rows.value = event.rows;
};

const fetchProductsWithBoMs = async () => {
  loading.value = true;
  try {
    const res = await getBoMsGroupedByProduct();
    products.value = res.data?.data || [];
  } finally {
    loading.value = false;
  }
};

const openAddDialog = (product) => {
  selectedBoM.value = null;
  selectedProductId.value = product.id;
  selectedProductName.value = product.name;
  editMode.value = false;
  showForm.value = true;
};
const openEditDialog = (product, bom) => {
  selectedBoM.value = bom;
  selectedProductId.value = product.id;
  selectedProductName.value = product.name;
  editMode.value = true;
  showForm.value = true;
};
const closeDialog = () => {
  showForm.value = false;
  selectedBoM.value = null;
  selectedProductId.value = null;
  selectedProductName.value = "";
  editMode.value = false;
};
const handleSave = async (formData) => {
  try {
    if (editMode.value) {
      await updateBoM(selectedBoM.value.id, formData);
      showSuccess("BoM updated successfully");
    } else {
      await createBoM(formData);
      showSuccess("BoM added successfully");
    }
    closeDialog();
    fetchProductsWithBoMs();
  } catch (e) {
    showApiError(e.response?.data?.message || e.message);
  }
};
const openDeleteDialog = (product, bom) => {
  if (confirm("Are you sure you want to delete this BoM?")) {
    deleteBoM(bom.id).then(fetchProductsWithBoMs);
    showSuccess("BoM deleted");
  }
};
onMounted(fetchProductsWithBoMs);
</script>
