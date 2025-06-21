<template>
  <DashboardLayout pageTitle="Transactions Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Transactions List</h2>
        </div>
      </template>
      <template #content>
        <p class="text-gray-500">Transactions management content will be implemented here.</p>
      </template>
    </Card>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import { showSuccess, showApiError } from "@/utils/toast";
</script>
