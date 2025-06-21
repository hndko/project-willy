<template>
  <div class="p-4 bg-white rounded-lg shadow">
    <DataTable :value="productions" :loading="loading" dataKey="id" responsiveLayout="scroll" class="p-datatable-sm">
      <Column field="production_date" header="Tanggal" sortable>
        <template #body="{ data }">
          {{ data.production_date ? format(new Date(data.production_date), "dd/MM/yyyy") : "-" }}
        </template>
      </Column>
      <Column field="product.name" header="Produk" sortable>
        <template #body="{ data }">
          {{ data.Product?.name || "-" }}
        </template>
      </Column>
      <Column field="qty" header="Qty" sortable />
      <Column field="status" header="Status" sortable>
        <template #body="{ data }">
          <span
            class="px-2 py-1 text-xs font-semibold rounded"
            :class="{
              'bg-gray-200 text-gray-700': data.status === 'planned',
              'bg-blue-200 text-blue-700': data.status === 'in_progress',
              'bg-green-200 text-green-700': data.status === 'done',
              'bg-red-200 text-red-700': data.status === 'canceled',
              'bg-gray-100 text-gray-500': !['planned', 'in_progress', 'done', 'canceled'].includes(data.status),
            }"
          >
            {{ data.status }}
          </span>
        </template>
      </Column>
      <Column field="hpp" header="HPP/Produk" sortable>
        <template #body="{ data }">
          {{ data.hpp ? data.hpp.toLocaleString("id-ID") : "-" }}
        </template>
      </Column>
      <Column header="Aksi" style="width: 120px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" class="p-button-sm p-button-text text-primary" @click="$emit('edit', data)" />
            <Button v-if="data.status === 'done'" icon="pi pi-eye" class="text-blue-600 p-button-sm p-button-text" @click="$emit('showHpp', data)" title="Detail HPP" />
            <Button icon="pi pi-trash" class="text-red-500 p-button-sm p-button-text" @click="$emit('delete', data)" />
            <Button v-if="data.status !== 'done'" icon="pi pi-cog" class="text-green-600 p-button-sm p-button-text" @click="$emit('process', data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { format } from "date-fns";

const props = defineProps({
  productions: Array,
  loading: Boolean,
});

const emit = defineEmits(["edit", "delete", "process", "add"]);
</script>

<style scoped>
.p-datatable .p-datatable-tbody > tr > td {
  vertical-align: middle;
}
</style>
