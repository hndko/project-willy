<template>
  <DashboardLayout pageTitle="Products Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Products List</h2>
          <Button label="Add Product" icon="pi pi-plus" @click="openProductForm()" />
        </div>
      </template>
      <template #content>
        <ProductTable @edit="editProduct" @refresh="handleRefresh" :refreshKey="refreshTable" />
      </template>
    </Card>

    <ProductForm v-model:visible="productFormVisible" :editData="selectedProduct" @refresh="handleRefresh" />

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
import ProductTable from "@/components/products/ProductTable.vue";
import ProductForm from "@/components/products/ProductForm.vue";

const route = useRoute();

// State management
const productFormVisible = ref(false);
const selectedProduct = ref(null);
const refreshTable = ref(0);

// Methods
const openProductForm = () => {
  selectedProduct.value = null;
  productFormVisible.value = true;
};

const editProduct = (product) => {
  selectedProduct.value = product;
  productFormVisible.value = true;
};

const handleRefresh = () => {
  refreshTable.value++;
};

// Check for query parameters on mount
onMounted(() => {
  if (route.query.action === "new") {
    openProductForm();
  }
});

// Watch for route query changes
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.action === "new") {
      openProductForm();
    }
  },
  { deep: true }
);
</script>
