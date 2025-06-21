<template>
  <Dialog :visible="visible" :style="{ width: '450px' }" :header="isEdit ? 'Edit Stock' : 'Add Stock'" :modal="true" class="p-fluid">
    <div class="mb-3 p-field">
      <label for="type" class="mb-2 font-medium">Type</label>
      <Dropdown id="type" v-model="localData.type" :options="stockTypes" placeholder="Select Type" :class="{ 'p-invalid': submitted && !localData.type }" required />
      <small v-if="submitted && !localData.type" class="p-error">Type is required.</small>
    </div>

    <div v-if="mode === 'product'" class="mb-3 p-field">
      <label for="productId" class="mb-2 font-medium">Product</label>
      <Dropdown id="productId" v-model="localData.productId" :options="products" optionLabel="name" optionValue="id" placeholder="Select Product" :class="{ 'p-invalid': submitted && mode === 'product' && !localData.productId }" required />
      <small v-if="submitted && mode === 'product' && !localData.productId" class="p-error">Product is required.</small>
    </div>

    <div v-if="mode === 'material'" class="mb-3 p-field">
      <label for="rawMaterialId" class="mb-2 font-medium">Raw Material</label>
      <Dropdown id="rawMaterialId" v-model="localData.rawMaterialId" :options="rawMaterials" optionLabel="name" optionValue="id" placeholder="Select Raw Material" :class="{ 'p-invalid': submitted && mode === 'material' && !localData.rawMaterialId }" required />
      <small v-if="submitted && mode === 'material' && !localData.rawMaterialId" class="p-error">Raw Material is required.</small>
    </div>

    <div class="mb-3 p-field">
      <label for="stock" class="mb-2 font-medium">Quantity</label>
      <InputNumber id="stock" v-model="localData.stock" placeholder="Enter Quantity" :class="{ 'p-invalid': submitted && !localData.stock }" required />
      <small v-if="submitted && !localData.stock" class="p-error">Quantity is required.</small>
    </div>

    <div class="mb-3 p-field">
      <label for="description" class="mb-2 font-medium">Description</label>
      <Textarea id="description" v-model="localData.description" rows="3" placeholder="Enter Description" />
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="onClose" />
      <Button label="Save" icon="pi pi-check" @click="onSave" />
    </template>
  </Dialog>
</template>

<script setup>
import { computed, watch, reactive } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import Textarea from "primevue/textarea";
import { createStock, updateStock } from "@/services/stockService";
import { showSuccess, showApiError } from "@/utils/toast";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    required: true,
    validator: (value) => ["product", "material"].includes(value),
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  submitted: {
    type: Boolean,
    default: false,
  },
  products: {
    type: Array,
    default: () => [],
  },
  rawMaterials: {
    type: Array,
    default: () => [],
  },
  stockTypes: {
    type: Array,
    default: () => [],
  },
  refreshCallback: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(["update:visible", "update:data", "update:mode", "update:isEdit", "update:submitted", "save", "close"]);

// Create a local copy of data that we can modify and sync with parent
const localData = reactive({ ...props.data });

// Watch for changes in props data and update local data
watch(
  () => props.data,
  (newVal) => {
    Object.assign(localData, newVal);
  },
  { deep: true }
);

// Watch for changes in local data and emit updates
watch(
  localData,
  (newVal) => {
    emit("update:data", { ...newVal });
  },
  { deep: true }
);

// Handle close button click
const onClose = () => {
  emit("close");
  emit("update:visible", false);
};

// Handle save button click
const onSave = async () => {
  try {
    if (props.isEdit) {
      await updateStock(localData.id, localData);
      showSuccess("Stok berhasil diubah");
    } else {
      await createStock(localData);
      showSuccess("Stok berhasil ditambahkan");
    }
    emit("update:visible", false);
    resetForm();
  } catch (error) {
    showApiError(error);
  }
};

const resetForm = () => {
  // Implement the reset form logic here
};
</script>
