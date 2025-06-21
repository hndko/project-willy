<template>
  <DashboardLayout pageTitle="Operational Costs Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Operational Costs List</h2>
          <Button label="Add Operational Cost" icon="pi pi-plus" @click="openOperationalCostForm()" />
        </div>
      </template>
      <template #content>
        <OperationalCostTable ref="operationalCostTable" @edit="editOperationalCost" @refresh="handleRefresh" :refresh="refreshTable" />
      </template>
    </Card>

    <OperationalCostForm v-model:visible="operationalCostFormVisible" :editData="selectedOperationalCost" @refresh="handleRefresh" />

    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Toast from "primevue/toast";
import OperationalCostTable from "@/components/operationalcosts/OperationalCostTable.vue";
import OperationalCostForm from "@/components/operationalcosts/OperationalCostForm.vue";
import { showSuccess, showApiError } from "@/utils/toast";

// State management
const operationalCostFormVisible = ref(false);
const selectedOperationalCost = ref(null);
const refreshTable = ref(false);
const operationalCostTable = ref(null);

// Methods
const openOperationalCostForm = () => {
  selectedOperationalCost.value = null;
  operationalCostFormVisible.value = true;
};

const editOperationalCost = (cost) => {
  selectedOperationalCost.value = cost;
  operationalCostFormVisible.value = true;
};

// Improved refresh handler
const handleRefresh = () => {
  // Force trigger a refresh
  refreshTable.value = true;

  // Ensure table component is refreshed
  if (operationalCostTable.value) {
    operationalCostTable.value.loadOperationalCosts();
  }

  // Reset flag after a short delay
  setTimeout(() => {
    refreshTable.value = false;
  }, 100);
};

// Ensure table is loaded on component mount
onMounted(() => {
  // Initial load
  if (operationalCostTable.value) {
    operationalCostTable.value.loadOperationalCosts();
  }
});
</script>
