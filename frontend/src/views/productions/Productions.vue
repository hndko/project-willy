<template>
  <DashboardLayout pageTitle="Production Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Production List</h2>
          <Button label="Add Production" icon="pi pi-plus" @click="openAddDialog" />
        </div>
      </template>
      <template #content>
        <div class="flex justify-between gap-2 mb-4">
          <div class="relative w-full md:w-80">
            <InputText v-model="search" placeholder="Search by product name..." class="w-full pl-10" @input="handleSearchInput" />
            <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
          </div>
        </div>
        <ProductionTable :productions="productions" :loading="loading" @add="openAddDialog" @edit="openEditDialog" @delete="openDeleteDialog" @process="openProcessDialog" @showHpp="handleShowHpp" />
        <Paginator :rows="rows" :totalRecords="totalItems" :first="(page - 1) * rows" @page="onPageChange" :rowsPerPageOptions="[5, 10, 20, 50]" />
      </template>
    </Card>

    <Dialog v-model:visible="showForm" :header="editMode ? 'Edit Production' : 'Add Production'" :style="{ width: '500px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <ProductionForm :production="selectedProduction" :editMode="editMode" @close="closeDialog" @saved="handleSave" />
    </Dialog>

    <Dialog v-model:visible="showHppDialog" header="Breakdown HPP" :modal="true" :style="{ width: '600px' }">
      <DataTable :value="hppBreakdown" class="p-datatable-sm">
        <Column field="raw_material_name" header="Bahan Baku" />
        <Column field="qty_per_product" header="Qty/Produk" />
        <Column field="qty_total" header="Qty Total" />
        <Column field="unit" header="Satuan" />
        <Column field="price" header="Harga Satuan">
          <template #body="{ data }">{{ data.price?.toLocaleString("id-ID") }}</template>
        </Column>
        <Column field="subtotal" header="Subtotal">
          <template #body="{ data }">{{ data.subtotal?.toLocaleString("id-ID") }}</template>
        </Column>
      </DataTable>
      <div class="mt-4 font-bold text-right">Total: {{ hppTotal.toLocaleString("id-ID") }}</div>
    </Dialog>

    <ConfirmDialog />
    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Toast from "primevue/toast";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import ProductionTable from "@/components/productions/ProductionTable.vue";
import ProductionForm from "@/components/productions/ProductionForm.vue";
import { getProductions, createProduction, updateProduction, deleteProduction, processProduction, getProductionHppBreakdown } from "@/services/productionService";
import { showSuccess, showApiError } from "@/utils/toast";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import Paginator from "primevue/paginator";

const productions = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editMode = ref(false);
const selectedProduction = ref(null);
const showHppDialog = ref(false);
const hppBreakdown = ref([]);
const hppTotal = ref(0);
const search = ref("");
const page = ref(1);
const rows = ref(10);
const totalItems = ref(0);

const fetchProductions = async () => {
  loading.value = true;
  try {
    const res = await getProductions({ search: search.value, page: page.value, limit: rows.value });
    productions.value = res.productions || res.data?.productions || res.data?.data || res.data || [];
    totalItems.value = res.totalItems || res.data?.totalItems || 0;
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  selectedProduction.value = null;
  editMode.value = false;
  showForm.value = true;
};
const openEditDialog = (row) => {
  selectedProduction.value = row;
  editMode.value = true;
  showForm.value = true;
};

const closeDialog = () => {
  showForm.value = false;
  selectedProduction.value = null;
  editMode.value = false;
};
const handleSave = async (formData) => {
  try {
    if (editMode.value) {
      await updateProduction(selectedProduction.value.id, formData);
      showSuccess("Production updated successfully");
    } else {
      await createProduction(formData);
      showSuccess("Production added successfully");
    }
    closeDialog();
    fetchProductions();
  } catch (e) {
    showApiError(e);
  }
};
const openDeleteDialog = (row) => {
  if (confirm("Are you sure you want to delete this production?")) {
    deleteProduction(row.id).then(fetchProductions);
    showSuccess("Production deleted");
  }
};
const openProcessDialog = async (row) => {
  if (confirm("Process this production? Raw material stock will be reduced and product stock will increase.")) {
    try {
      await processProduction(row.id);
      showSuccess("Production processed successfully");
      fetchProductions();
    } catch (e) {
      showApiError(e);
    }
  }
};
const handleShowHpp = async (row) => {
  showHppDialog.value = true;
  hppBreakdown.value = [];
  hppTotal.value = 0;
  try {
    const res = await getProductionHppBreakdown(row.id);
    hppBreakdown.value = res.data?.breakdown || res.breakdown || [];
    hppTotal.value = res.data?.total || res.total || 0;
  } catch (e) {
    showApiError(e);
  }
};
const handleSearchInput = () => {
  page.value = 1;
  fetchProductions();
};
const onPageChange = (event) => {
  page.value = event.page + 1;
  rows.value = event.rows;
  fetchProductions();
};
onMounted(fetchProductions);
</script>
