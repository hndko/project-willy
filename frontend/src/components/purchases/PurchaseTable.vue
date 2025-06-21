<template>
  <div class="w-full purchase-table">
    <div class="flex flex-col justify-between gap-2 mb-4 md:flex-row">
      <div class="relative w-full md:w-80">
        <InputText v-model="searchTerm" placeholder="Search by material, supplier..." class="w-full pl-10" @input="onSearch" />
        <i class="absolute text-gray-400 -translate-y-1/2 pi pi-search top-1/2 left-3"></i>
      </div>
      <Button icon="pi pi-refresh" @click="$emit('refresh')" text rounded :loading="loading" :disabled="loading" class="p-button-rounded" aria-label="Refresh data" />
    </div>
    <div class="overflow-x-auto bg-white rounded-lg shadow-md">
      <DataTable
        :value="purchases"
        stripedRows
        :paginator="true"
        :rows="limit"
        :first="(page - 1) * limit"
        :totalRecords="totalRecords"
        @page="onPageChange"
        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        :rowsPerPageOptions="[10, 20, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
        responsiveLayout="scroll"
        :loading="loading"
        emptyMessage="No purchases found"
        class="p-datatable-sm w-full min-w-[900px]"
        tableStyle="min-width: 50rem"
        tableClass="p-datatable-table"
      >
        <!-- Raw Material Column -->
        <Column field="RawMaterial.name" header="Raw Material" sortable style="min-width: 200px" bodyClass="p-column-title">
          <template #body="{ data }">
            {{ data.RawMaterial?.name || "N/A" }}
          </template>
        </Column>
        <!-- Supplier Column -->
        <Column field="Supplier.name" header="Supplier" sortable style="min-width: 200px" bodyClass="p-column-title">
          <template #body="{ data }">
            {{ data.Supplier?.name || "N/A" }}
          </template>
        </Column>
        <!-- Quantity Column -->
        <Column field="qty" header="Quantity" sortable style="min-width: 100px" bodyClass="p-column-title">
          <template #body="{ data }"> {{ data.qty }} {{ data.RawMaterial && data.RawMaterial.unit ? data.RawMaterial.unit : "-" }} </template>
        </Column>
        <!-- Price Column -->
        <Column field="price" header="Price/Unit" sortable style="min-width: 120px" bodyClass="p-column-title">
          <template #body="{ data }">
            {{ formatCurrency(data.price) }}
          </template>
        </Column>
        <!-- Total Column -->
        <Column field="total" header="Total" sortable style="min-width: 120px" bodyClass="p-column-title">
          <template #body="{ data }">
            {{ formatCurrency(data.total) }}
          </template>
        </Column>
        <!-- Date Column -->
        <Column field="date" header="Date" sortable style="min-width: 120px" bodyClass="p-column-title">
          <template #body="{ data }">
            {{ formatDate(data.date) }}
          </template>
        </Column>
        <!-- Status Column -->
        <Column field="status" header="Status" sortable style="min-width: 120px" bodyClass="p-column-title">
          <template #body="{ data }">
            <Tag :value="capitalize(data.status)" :severity="statusSeverity(data.status)" />
          </template>
        </Column>
        <!-- Invoice Number Column -->
        <Column field="invoiceNumber" header="Invoice Number" sortable style="min-width: 120px" bodyClass="p-column-title">
          <template #body="{ data }">
            {{ data.invoiceNumber || data.invoice_number || "-" }}
          </template>
        </Column>
        <!-- Actions Column -->
        <Column header="Actions" style="min-width: 120px" bodyClass="p-column-title">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button icon="pi pi-eye" severity="info" text rounded @click="$emit('view', slotProps.data)" aria-label="View" />
              <Button icon="pi pi-pencil" severity="warning" text rounded @click="$emit('edit', slotProps.data)" aria-label="Edit" />
              <Button icon="pi pi-trash" severity="danger" text rounded @click="$emit('delete', slotProps.data)" aria-label="Delete" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import { showSuccess, showApiError } from "@/utils/toast";

const props = defineProps({
  purchases: Array,
  loading: Boolean,
  totalRecords: Number,
  page: Number,
  limit: Number,
});
const emit = defineEmits(["search", "add", "edit", "delete", "view", "refresh", "page-change"]);
const searchTerm = ref("");

const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};
const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");
const statusSeverity = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "completed":
      return "success";
    case "canceled":
      return "danger";
    default:
      return "info";
  }
};
let searchTimeout;
const onSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit("search", searchTerm.value);
  }, 500);
};
const onPageChange = (event) => {
  emit("page-change", event.page + 1);
};

async function handleDelete(id) {
  try {
    await deletePurchase(id);
    showSuccess("Pembelian berhasil dihapus");
    // ... existing code ...
  } catch (err) {
    showApiError(err);
  }
}
</script>
