<template>
  <form @submit.prevent="$emit('submit')">
    <div class="mb-4">
      <label class="block mb-1 font-medium">Name</label>
      <InputText v-model="formData.name" class="w-full" required />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-medium">Email</label>
      <InputText v-model="formData.email" class="w-full" required />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-medium">Phone</label>
      <InputText v-model="formData.phone" class="w-full" required />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-medium">Role</label>
      <Dropdown v-model="formData.role_id" :options="roles" optionLabel="name" optionValue="id" placeholder="Select Role" class="w-full" required :disabled="!isAdminOrOwner" />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-medium">Status</label>
      <Dropdown v-model="formData.is_active" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" :disabled="!isAdminOrOwner" />
    </div>
    <div class="flex justify-end gap-2">
      <Button label="Cancel" class="p-button-text" @click="$emit('cancel')" type="button" />
      <Button :label="editing ? 'Update' : 'Create'" type="submit" :loading="loading" />
    </div>
  </form>
</template>

<script setup>
import { defineProps, defineEmits, computed } from "vue";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import Button from "primevue/button";

const props = defineProps({
  formData: Object,
  roles: Array,
  statusOptions: Array,
  loading: Boolean,
  editing: Boolean,
  userRole: String,
});
const emit = defineEmits(["submit", "cancel"]);
const isAdminOrOwner = computed(() => props.userRole === "admin" || props.userRole === "owner");
</script>
