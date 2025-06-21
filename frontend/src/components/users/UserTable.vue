<template>
  <DataTable :value="users" dataKey="id" class="p-datatable-sm" responsiveLayout="scroll">
    <Column field="name" header="Name" />
    <Column field="email" header="Email" />
    <Column field="role.name" header="Role">
      <template #body="{ data }">
        <span>{{ data.Role && data.Role.name ? data.Role.name : "-" }}</span>
      </template>
    </Column>
    <Column field="is_active" header="Status">
      <template #body="{ data }">
        <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
      </template>
    </Column>
    <Column header="Actions" style="width: 160px">
      <template #body="{ data }">
        <div class="flex items-center gap-2">
          <InputSwitch v-if="isAdminOrOwner" v-model="data.is_active" @change="$emit('toggle-status', data)" :pt="{ root: { style: 'margin-right: 8px;' } }" />
          <Button v-if="isAdminOrOwner" icon="pi pi-pencil" class="p-button-sm p-button-text" @click="$emit('edit', data)" />
          <Button v-if="isAdminOrOwner" icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" @click="$emit('delete', data)" />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup>
import { defineProps, defineEmits, computed } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Tag from "primevue/tag";
import InputSwitch from "primevue/inputswitch";

const props = defineProps({ users: Array, userRole: String });
const emit = defineEmits(["edit", "delete", "toggle-status"]);
const isAdminOrOwner = computed(() => props.userRole === "admin" || props.userRole === "owner");
</script>
