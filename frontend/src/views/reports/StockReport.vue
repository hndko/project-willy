<template>
  <DashboardLayout pageTitle="Stock Reports">
    <Card class="mb-4 shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Stock Reports</h2>
          <Button label="Export Report" icon="pi pi-download" @click="exportReport" class="p-button-sm" />
        </div>
      </template>
      <template #content>
        <div class="flex flex-wrap justify-between gap-3 mb-4">
          <div class="flex flex-wrap gap-3">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="filters.search" placeholder="Search..." class="p-inputtext-sm" />
            </span>

            <Dropdown v-model="filters.type" :options="stockTypes" placeholder="Select Type" class="w-32 p-inputtext-sm" />

            <div class="flex items-center gap-2">
              <Calendar v-model="filters.startDate" placeholder="Start Date" class="p-inputtext-sm w-36" dateFormat="dd/mm/yy" />
              <span>to</span>
              <Calendar v-model="filters.endDate" placeholder="End Date" class="p-inputtext-sm w-36" dateFormat="dd/mm/yy" />
            </div>
          </div>

          <div class="flex gap-2">
            <Button label="Generate Report" icon="pi pi-filter" @click="searchReport" class="p-button-sm p-button-outlined" />
            <Button label="Reset" icon="pi pi-refresh" @click="resetFilters" class="p-button-sm p-button-outlined p-button-secondary" />
          </div>
        </div>

        <DataTable :value="stocks" :loading="loading" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 25, 50]" tableStyle="min-width: 50rem" v-model:filters="dtFilters" filterDisplay="menu" dataKey="id" class="p-datatable-sm">
          <Column field="type" header="Type" :sortable="true">
            <template #body="slotProps">
              <Tag :value="slotProps.data.type" :severity="getTypeSeverity(slotProps.data.type)" />
            </template>
          </Column>
          <Column field="Product.name" header="Product">
            <template #body="slotProps">
              {{ slotProps.data.Product?.name || "N/A" }}
            </template>
          </Column>
          <Column field="stock" header="Quantity" :sortable="true" />
          <Column field="description" header="Description" />
          <Column field="createdAt" header="Date" :sortable="true">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>
        </DataTable>

        <div class="flex justify-center mt-4">
          <Paginator v-model:first="first" :rows="10" :totalRecords="totalRecords" @page="onPageChange($event)" :rowsPerPageOptions="[5, 10, 25, 50]" />
        </div>

        <!-- Stock Statistics Cards -->
        <div class="grid grid-cols-1 gap-4 mt-6 md:grid-cols-4">
          <div class="p-4 bg-green-100 rounded-lg shadow-sm">
            <h3 class="text-sm font-semibold text-green-800">Total Stock In</h3>
            <p class="text-2xl font-bold text-green-600">{{ stats.stockIn }}</p>
          </div>
          <div class="p-4 bg-blue-100 rounded-lg shadow-sm">
            <h3 class="text-sm font-semibold text-blue-800">Total Stock Out</h3>
            <p class="text-2xl font-bold text-blue-600">{{ stats.stockOut }}</p>
          </div>
          <div class="p-4 bg-yellow-100 rounded-lg shadow-sm">
            <h3 class="text-sm font-semibold text-yellow-800">Total Expired</h3>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.expired }}</p>
          </div>
          <div class="p-4 bg-red-100 rounded-lg shadow-sm">
            <h3 class="text-sm font-semibold text-red-800">Total Rejected</h3>
            <p class="text-2xl font-bold text-red-600">{{ stats.rejected }}</p>
          </div>
        </div>
      </template>
    </Card>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Paginator from "primevue/paginator";
import Tag from "primevue/tag";
import Calendar from "primevue/calendar";
import { showSuccess, showApiError } from "@/utils/toast";

import { searchStockReport } from "@/services/stockService";

// Data
const loading = ref(false);
const stocks = ref([]);
const totalRecords = ref(0);
const first = ref(0);
const stockTypes = ["in", "out", "expired", "reject"];

// Filters
const filters = reactive({
  search: "",
  type: null,
  startDate: null,
  endDate: null,
  page: 1,
  limit: 10,
});

// Simple filter configuration without FilterMatchMode
const dtFilters = ref({
  global: { value: null, matchMode: "contains" },
});

// Computed statistics
const stats = computed(() => {
  return {
    stockIn: stocks.value.filter((stock) => stock.type === "in").reduce((sum, stock) => sum + stock.stock, 0),
    stockOut: stocks.value.filter((stock) => stock.type === "out").reduce((sum, stock) => sum + stock.stock, 0),
    expired: stocks.value.filter((stock) => stock.type === "expired").reduce((sum, stock) => sum + stock.stock, 0),
    rejected: stocks.value.filter((stock) => stock.type === "reject").reduce((sum, stock) => sum + stock.stock, 0),
  };
});

// Functions
const searchReport = async () => {
  try {
    loading.value = true;

    // Format dates for API if they exist
    const params = {
      search: filters.search,
      type: filters.type,
      page: filters.page,
      limit: filters.limit,
    };

    if (filters.startDate) {
      params.startDate = formatDateForAPI(filters.startDate);
    }

    if (filters.endDate) {
      params.endDate = formatDateForAPI(filters.endDate);
    }

    const response = await searchStockReport(params);

    stocks.value = response.data;
    totalRecords.value = response.totalData;
  } catch (error) {
    showApiError("Error loading stock report", error);
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.search = "";
  filters.type = null;
  filters.startDate = null;
  filters.endDate = null;
  filters.page = 1;
  searchReport();
};

const onPageChange = (event) => {
  filters.page = event.page + 1;
  filters.limit = event.rows;
  first.value = event.first;
  searchReport();
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateForAPI = (date) => {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
};

const getTypeSeverity = (type) => {
  switch (type) {
    case "in":
      return "success";
    case "out":
      return "info";
    case "expired":
      return "warning";
    case "reject":
      return "danger";
    default:
      return null;
  }
};

const exportReport = () => {
  // Create a CSV string from the stocks data
  let csvContent = "data:text/csv;charset=utf-8,";

  // Add headers
  csvContent += "Type,Product,Quantity,Description,Date\r\n";

  // Add data rows
  stocks.value.forEach((stock) => {
    const productName = stock.Product?.name || "N/A";
    const dateFormatted = formatDate(stock.createdAt);
    csvContent += `${stock.type},"${productName}",${stock.stock},"${stock.description || ""}","${dateFormatted}"\r\n`;
  });

  // Create and trigger download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `stock-report-${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showSuccess("Report exported successfully");
};

// Lifecycle
onMounted(() => {
  searchReport();
});
</script>
