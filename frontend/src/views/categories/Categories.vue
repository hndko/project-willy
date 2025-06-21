<template>
  <DashboardLayout pageTitle="Category Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Categories List</h2>
          <Button label="Add Category" icon="pi pi-plus" @click="openCategoryForm()" />
        </div>
      </template>
      <template #content>
        <CategoryTable @edit="editCategory" @refresh="handleRefresh" :refresh="refreshTable" />
      </template>
    </Card>

    <CategoryForm v-model:visible="categoryFormVisible" :editData="selectedCategory" @refresh="handleRefresh" />

    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Toast from "primevue/toast";
import CategoryTable from "@/components/categories/CategoryTable.vue";
import CategoryForm from "@/components/categories/CategoryForm.vue";
import { showSuccess, showApiError } from "@/utils/toast";

// State management
const categoryFormVisible = ref(false);
const selectedCategory = ref(null);
const refreshTable = ref(false);

// Methods
const openCategoryForm = () => {
  selectedCategory.value = null;
  categoryFormVisible.value = true;
};

const editCategory = (category) => {
  selectedCategory.value = category;
  categoryFormVisible.value = true;
};

const handleRefresh = () => {
  refreshTable.value = true;
};
</script>
