<template>
  <DashboardLayout pageTitle="Raw Materials Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Raw Materials List</h2>
          <Button label="Manage Raw Material" icon="pi pi-plus" @click="openRawMaterialForm()" />
        </div>
      </template>
      <template #content>
        <RawMaterialTable @edit="editRawMaterial" @refresh="handleRefresh" :refresh="refreshTable" />
      </template>
    </Card>

    <RawMaterialForm v-model:visible="rawMaterialFormVisible" :editData="selectedRawMaterial" @refresh="handleRefresh" />

    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Toast from "primevue/toast";
import RawMaterialTable from "@/components/rawmaterials/RawMaterialTable.vue";
import RawMaterialForm from "@/components/rawmaterials/RawMaterialForm.vue";
import { showSuccess, showApiError } from "@/utils/toast";

const route = useRoute();

// State management
const rawMaterialFormVisible = ref(false);
const selectedRawMaterial = ref(null);
const refreshTable = ref(false);

// Methods
const openRawMaterialForm = () => {
  selectedRawMaterial.value = null;
  rawMaterialFormVisible.value = true;
};

const editRawMaterial = (material) => {
  selectedRawMaterial.value = material;
  rawMaterialFormVisible.value = true;
};

const handleRefresh = () => {
  refreshTable.value = true;
};

// Check for query parameters on mount
onMounted(() => {
  if (route.query.action === "new") {
    openRawMaterialForm();
  }
});

// Watch for route query changes
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.action === "new") {
      openRawMaterialForm();
    }
  },
  { deep: true }
);
</script>
