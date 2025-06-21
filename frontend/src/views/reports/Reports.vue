<template>
  <DashboardLayout pageTitle="Reports">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Reports Dashboard</h2>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <!-- Stock Reports -->
          <div class="p-4 transition-all border border-blue-100 rounded-lg shadow-sm cursor-pointer bg-blue-50 hover:shadow-md" @click="navigateTo('/reports/stock')">
            <div class="flex items-center gap-3 mb-3">
              <i class="text-2xl text-blue-500 pi pi-chart-bar"></i>
              <h3 class="text-lg font-semibold text-blue-700">Stock Reports</h3>
            </div>
            <p class="mb-4 text-sm text-gray-600">View stock movement reports including stock in, out, expired, and rejected items.</p>
            <div class="flex justify-end">
              <Button label="View Report" icon="pi pi-arrow-right" class="p-button-sm p-button-outlined p-button-info" @click.stop="navigateTo('/reports/stock')" />
            </div>
          </div>

          <!-- Placeholder for future reports -->
          <div class="p-4 border border-gray-100 rounded-lg shadow-sm bg-gray-50">
            <div class="flex items-center gap-3 mb-3">
              <i class="text-2xl text-gray-400 pi pi-chart-line"></i>
              <h3 class="text-lg font-semibold text-gray-500">Sales Reports</h3>
            </div>
            <p class="mb-4 text-sm text-gray-500">Sales reports will be available in future updates.</p>
            <div class="flex justify-end">
              <Button label="Coming Soon" icon="pi pi-clock" class="p-button-sm p-button-outlined p-button-secondary" disabled />
            </div>
          </div>

          <!-- Placeholder for future reports -->
          <div class="p-4 border border-gray-100 rounded-lg shadow-sm bg-gray-50">
            <div class="flex items-center gap-3 mb-3">
              <i class="text-2xl text-gray-400 pi pi-dollar"></i>
              <h3 class="text-lg font-semibold text-gray-500">Financial Reports</h3>
            </div>
            <p class="mb-4 text-sm text-gray-500">Financial reports will be available in future updates.</p>
            <div class="flex justify-end">
              <Button label="Coming Soon" icon="pi pi-clock" class="p-button-sm p-button-outlined p-button-secondary" disabled />
            </div>
          </div>
        </div>
      </template>
    </Card>
  </DashboardLayout>
</template>

<script setup>
import { useRouter } from "vue-router";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import { showSuccess, showApiError } from "@/utils/toast";

const router = useRouter();

const navigateTo = (path) => {
  router.push(path);
};
</script>
