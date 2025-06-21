<template>
  <div class="p-4 bg-white rounded-lg shadow">
    <DataTable :value="boms" :loading="loading" dataKey="id" responsiveLayout="scroll" class="p-datatable-sm">
      <Column field="raw_material_name" header="Bahan Baku">
        <template #body="{ data }">
          {{ data.raw_material_name || "-" }}
        </template>
      </Column>
      <Column field="qty" header="Qty" />
      <Column field="unit" header="Satuan">
        <template #body="{ data }">
          {{ data.raw_material?.unit || data.unit || "-" }}
        </template>
      </Column>
      <Column header="Aksi" style="width: 100px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" class="p-button-sm p-button-text text-primary" @click="$emit('edit', data)" />
            <Button icon="pi pi-trash" class="text-red-500 p-button-sm p-button-text" @click="$emit('delete', data)" />
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
import { showSuccess, showApiError } from "@/utils/toast";

const props = defineProps({
  boms: Array,
  loading: Boolean,
});
const emit = defineEmits(["edit", "delete", "add"]);
</script>
