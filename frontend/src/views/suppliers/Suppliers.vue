<template>
  <DashboardLayout pageTitle="Supplier Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Suppliers List</h2>
          <Button label="Add Supplier" icon="pi pi-plus" @click="openSupplierForm()" />
        </div>
      </template>
      <template #content>
        <SupplierTable @edit="editSupplier" @refresh="handleRefresh" :refresh="refreshTable" />
      </template>
    </Card>

    <SupplierForm v-model:visible="supplierFormVisible" :editData="selectedSupplier" @refresh="handleRefresh" />

    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Toast from "primevue/toast";
import SupplierTable from "@/components/suppliers/SupplierTable.vue";
import SupplierForm from "@/components/suppliers/SupplierForm.vue";
import { showSuccess, showApiError } from "@/utils/toast";

// State management
const supplierFormVisible = ref(false);
const selectedSupplier = ref(null);
const refreshTable = ref(false);

// Methods
const openSupplierForm = () => {
  selectedSupplier.value = null;
  supplierFormVisible.value = true;
};

const editSupplier = (supplier) => {
  selectedSupplier.value = supplier;
  supplierFormVisible.value = true;
};

const handleRefresh = () => {
  refreshTable.value = true;
};
</script>
