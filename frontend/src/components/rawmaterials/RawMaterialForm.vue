<template>
  <Dialog :visible="visible" :style="{ width: '450px' }" :header="editMode ? 'Edit Raw Material' : 'Add Raw Material'" :modal="true" class="p-fluid" @update:visible="$emit('update:visible', $event)">
    <div class="p-4">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label for="name" class="block mb-2 font-medium text-gray-700 w-5/5">Name</label>
          <InputText id="name" v-model="rawMaterial.name" :class="{ 'p-invalid': submitted && !rawMaterial.name }" placeholder="Material name" required />
          <small v-if="submitted && !rawMaterial.name" class="p-error">Name is required</small>
        </div>

        <div class="mb-4">
          <label for="unit" class="block mb-2 font-medium text-gray-700">Unit</label>
          <div class="flex gap-2">
            <Dropdown id="unit" v-model="rawMaterial.unit" :options="unitOptions" optionLabel="label" optionValue="value" placeholder="Pilih unit" :class="{ 'p-invalid': submitted && !rawMaterial.unit }" class="w-2/5" required />
          </div>
          <small v-if="submitted && !rawMaterial.unit" class="p-error">Unit is required</small>
        </div>

        <div class="mb-4">
          <label for="price" class="block mb-2 font-medium text-gray-700">Price</label>
          <InputNumber id="price" v-model="rawMaterial.price" :class="{ 'p-invalid': submitted && !rawMaterial.price }" mode="currency" currency="IDR" locale="id-ID" placeholder="Enter price" :minFractionDigits="0" :maxFractionDigits="0" required />
          <small v-if="submitted && !rawMaterial.price" class="p-error">Price is required</small>
        </div>

        <div class="mb-4">
          <label for="stock" class="block mb-2 font-medium text-gray-700">Stock</label>
          <InputNumber id="stock" v-model="rawMaterial.stock" disabled :class="{ 'p-invalid': submitted && !rawMaterial.stock }" placeholder="Enter stock amount" required />
          <p class="text-sm text-gray-500">Tambah & edit stock silahkan ke <a href="products/stock" class="text-blue-500 hover:underline" target="_blank">Stock Management</a></p>
          <small v-if="submitted && !rawMaterial.stock" class="p-error">Stock is required</small>
        </div>

        <div class="mb-4">
          <label for="is_active" class="block mb-2 font-medium text-gray-700">Status</label>
          <div class="flex items-center gap-3">
            <InputSwitch v-model="rawMaterial.is_active" inputId="is_active" />
            <span>{{ rawMaterial.is_active ? "Active" : "Inactive" }}</span>
          </div>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" icon="pi pi-times" @click="$emit('update:visible', false)" text />
        <Button :label="editMode ? 'Update' : 'Create'" icon="pi pi-check" @click="submitForm" :loading="loading" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import InputSwitch from "primevue/inputswitch";
import Dropdown from "primevue/dropdown";
import { showSuccess, showApiError } from "@/utils/toast";
import { createRawMaterial, updateRawMaterial } from "@/services/rawMaterialService";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  editData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:visible", "refresh"]);

const loading = ref(false);
const submitted = ref(false);
const rawMaterial = ref({
  name: "",
  unit: "",
  price: 0,
  stock: 0,
  is_active: true,
});

const editMode = computed(() => !!props.editData);

const unitOptions = [
  { label: "ml", value: "ml" },
  { label: "l", value: "l" },
  { label: "gram", value: "gram" },
  { label: "kg", value: "kg" },
  { label: "pcs", value: "pcs" },
  { label: "roll", value: "roll" },
  { label: "box", value: "box" },
  { label: "set", value: "set" },
];

// Watch for changes in the dropdown
watch(
  () => rawMaterial.value.unit,
  (newVal) => {
    // If the unit is changed from dropdown, clear the custom input
    if (unitOptions.some((option) => option.value === newVal)) {
      customUnit.value = "";
    }
  }
);

// Define resetForm before it's used in the watch function
const resetForm = () => {
  rawMaterial.value = {
    name: "",
    unit: "",
    price: 0,
    stock: 0,
    is_active: true,
  };
  submitted.value = false;
};

// Watch for changes in the editData prop
watch(
  () => props.editData,
  (newVal) => {
    if (newVal) {
      rawMaterial.value = { ...newVal };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for visibility changes
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      resetForm();
    }
  }
);

const submitForm = async () => {
  submitted.value = true;

  if (!rawMaterial.value.name || !rawMaterial.value.unit || !rawMaterial.value.price) {
    return;
  }

  try {
    loading.value = true;

    if (editMode.value) {
      await updateRawMaterial(rawMaterial.value.id, rawMaterial.value);
      showSuccess("Raw Material updated successfully");
    } else {
      await createRawMaterial(rawMaterial.value);
      showSuccess("Raw Material created successfully");
    }

    emit("update:visible", false);
    emit("refresh");
    resetForm();
  } catch (error) {
    console.error("Error saving raw material:", error);
    showApiError("Gagal menyimpan bahan baku");
  } finally {
    loading.value = false;
  }
};
</script>
