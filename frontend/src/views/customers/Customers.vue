<template>
  <DashboardLayout pageTitle="Customer Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Customers List</h2>
          <Button label="Add Customer" icon="pi pi-plus" @click="openCustomerForm()" />
        </div>
      </template>
      <template #content>
        <CustomerTable @edit="editCustomer" @refresh="handleRefresh" :refresh="refreshTable" />
      </template>
    </Card>

    <CustomerForm v-model:visible="customerFormVisible" :editData="selectedCustomer" @refresh="handleRefresh" />

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
import CustomerTable from "@/components/customers/CustomerTable.vue";
import CustomerForm from "@/components/customers/CustomerForm.vue";
import { showSuccess, showApiError } from "@/utils/toast";

const route = useRoute();

// State management
const customerFormVisible = ref(false);
const selectedCustomer = ref(null);
const refreshTable = ref(false);

// Methods
const openCustomerForm = () => {
  selectedCustomer.value = null;
  customerFormVisible.value = true;
};

const editCustomer = (customer) => {
  selectedCustomer.value = customer;
  customerFormVisible.value = true;
};

const handleRefresh = () => {
  refreshTable.value = !refreshTable.value;
};

// Check for query parameters on mount
onMounted(() => {
  if (route.query.action === "new") {
    openCustomerForm();
  }
});

// Watch for route query changes
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.action === "new") {
      openCustomerForm();
    }
  },
  { deep: true }
);
</script>
