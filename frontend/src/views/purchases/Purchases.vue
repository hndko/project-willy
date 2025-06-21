<template>
  <DashboardLayout pageTitle="Purchases Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Purchase List</h2>
          <Button label="Add Purchase" icon="pi pi-plus" @click="openAddDialog" />
        </div>
      </template>
      <template #content>
        <PurchaseTable
          :purchases="purchases"
          :loading="loading"
          :totalRecords="totalRecords"
          :page="searchParams.page"
          :limit="searchParams.limit"
          @search="handleSearch"
          @page-change="handlePageChange"
          @add="openAddDialog"
          @edit="openEditDialog"
          @delete="confirmDelete"
          @view="openViewDialog"
        />
      </template>
    </Card>

    <!-- Add/Edit Purchase Dialog -->
    <Dialog v-model:visible="formDialog" :header="editMode ? 'Edit Purchase' : 'Add New Purchase'" :style="{ width: '600px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <PurchaseForm :purchase="selectedPurchase" :editMode="editMode" @close="formDialog = false" @saved="handleSaved" />
    </Dialog>

    <!-- View Purchase Details Dialog -->
    <Dialog v-model:visible="detailDialog" header="Purchase Details" :style="{ width: '650px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <PurchaseDetail :purchase="selectedPurchase" :loading="detailLoading" @close="detailDialog = false" @edit="handleDetailEdit" />
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog></ConfirmDialog>
    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import { useConfirm } from "primevue/useconfirm";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";
import { showSuccess, showApiError } from "@/utils/toast";

import PurchaseTable from "@/components/purchases/PurchaseTable.vue";
import PurchaseForm from "@/components/purchases/PurchaseForm.vue";
import PurchaseDetail from "@/components/purchases/PurchaseDetail.vue";
import { getPurchases, getPurchaseById, deletePurchase } from "@/services/purchaseService";

// State management
const confirm = useConfirm();
const purchases = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const formDialog = ref(false);
const detailDialog = ref(false);
const detailLoading = ref(false);
const editMode = ref(false);
const selectedPurchase = ref({});

// Search params
const searchParams = ref({
  page: 1,
  limit: 10,
  search: "",
});

// Fetch purchases with pagination and search
const fetchPurchases = async () => {
  loading.value = true;
  try {
    const response = await getPurchases(searchParams.value);
    purchases.value = response.data.purchases || [];
    totalRecords.value = response.data.totalItems || 0;
  } catch (error) {
    console.error("Error fetching purchases:", error);
    showApiError("Error", "Failed to load purchase data");
  } finally {
    loading.value = false;
  }
};

// Handle search from table component
const handleSearch = (searchTerm) => {
  searchParams.value.search = searchTerm;
  searchParams.value.page = 1;
  fetchPurchases();
};

// Open dialog to add a new purchase
const openAddDialog = () => {
  editMode.value = false;
  selectedPurchase.value = {};
  formDialog.value = true;
};

// Open dialog to edit an existing purchase
const openEditDialog = (purchase) => {
  editMode.value = true;
  selectedPurchase.value = { ...purchase };
  formDialog.value = true;
};

// Open dialog to view purchase details
const openViewDialog = async (purchase) => {
  try {
    detailLoading.value = true;
    selectedPurchase.value = { ...purchase };
    detailDialog.value = true;

    // Fetch complete purchase details
    const response = await getPurchaseById(purchase.id);
    if (response.data) {
      selectedPurchase.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching purchase details:", error);
    showApiError("Error", "Failed to load purchase details");
  } finally {
    detailLoading.value = false;
  }
};

// Handle edit from detail view
const handleDetailEdit = (purchase) => {
  detailDialog.value = false;
  openEditDialog(purchase);
};

// Handle save/update from form
const handleSaved = (purchase) => {
  formDialog.value = false;
  fetchPurchases();

  // Show success message
  showSuccess("Success", editMode.value ? "Purchase updated successfully" : "Purchase created successfully");
};

// Confirm and delete purchase
const confirmDelete = (purchase) => {
  confirm.require({
    message: "Are you sure you want to delete this purchase?",
    header: "Delete Confirmation",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await deletePurchase(purchase.id);
        fetchPurchases();
        showSuccess("Success", "Purchase deleted successfully");
      } catch (error) {
        console.error("Error deleting purchase:", error);
        showApiError("Error", "Failed to delete purchase");
      }
    },
  });
};

// Tambahkan handler untuk pagination
const handlePageChange = (page) => {
  searchParams.value.page = page;
  fetchPurchases();
};

// Initial data fetch
onMounted(() => {
  fetchPurchases();
});
</script>
