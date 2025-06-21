<template>
  <DashboardLayout pageTitle="Raw Material Usage Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Raw Material Usage List</h2>
          <Button label="Record Usage" icon="pi pi-plus" @click="openUsageForm()" />
        </div>
      </template>
      <template #content>
        <UsageTable @edit="editUsage" @refresh="handleRefresh" :refresh="refreshTable" />
      </template>
    </Card>

    <UsageForm v-model:visible="usageFormVisible" :editData="selectedUsage" @refresh="handleRefresh" />

    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, watch } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Toast from "primevue/toast";
import UsageTable from "@/components/usages/UsageTable.vue";
import UsageForm from "@/components/usages/UsageForm.vue";
import { showSuccess, showApiError } from "@/utils/toast";

// State management
const usageFormVisible = ref(false);
const selectedUsage = ref(null);
const refreshTable = ref(false);

// Methods
const openUsageForm = () => {
  selectedUsage.value = null;
  usageFormVisible.value = true;
};

const editUsage = (usage) => {
  selectedUsage.value = usage;
  usageFormVisible.value = true;
};

const handleRefresh = () => {
  refreshTable.value = true;
  // Reset refresh flag setelah 1 detik
  setTimeout(() => {
    refreshTable.value = false;
  }, 1000);
};

// Watch refresh operation to ensure table is updated
watch(refreshTable, (newVal) => {
  if (newVal) {
    // Reset refresh flag setelah 1 detik untuk memastikan operasi berikutnya juga berfungsi
    setTimeout(() => {
      refreshTable.value = false;
    }, 1000);
  }
});
</script>
