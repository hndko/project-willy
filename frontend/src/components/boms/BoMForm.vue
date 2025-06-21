<template>
  <form @submit.prevent="handleSubmit" class="w-full p-4 bg-white rounded-lg shadow">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label class="block mb-1 font-medium">Product *</label>
        <input type="text" :value="props.productName" class="w-full p-2 bg-gray-200 rounded-md" readonly />
      </div>
      <div>
        <label class="block mb-1 font-medium">Raw Material *</label>
        <Dropdown v-model="form.raw_material_id" :options="rawMaterials" optionLabel="name" optionValue="id" placeholder="Select Raw Material" class="w-full" :disabled="editMode" :class="{ 'p-invalid': submitted && !form.raw_material_id }" @change="updateUnit" />
        <small v-if="submitted && !form.raw_material_id" class="p-error">Raw material is required</small>
      </div>
      <div>
        <label class="block mb-1 font-medium">Qty *</label>
        <input v-model.number="form.qty" type="number" min="0.01" step="0.01" class="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400" :class="{ 'border-red-500': submitted && !form.qty }" placeholder="Qty" />
        <small v-if="submitted && !form.qty" class="text-red-500">Quantity is required</small>
      </div>
      <div>
        <label class="block mb-1 font-medium">Unit</label>
        <InputText v-model="form.unit" class="w-full bg-gray-100" readonly />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <Button type="button" label="Cancel" icon="pi pi-times" outlined @click="closeDialog" class="text-gray-700 bg-gray-200" />
      <Button type="submit" label="Save" icon="pi pi-check" class="text-white bg-primary" :loading="loading" />
    </div>
  </form>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { getRawMaterials } from "@/services/rawMaterialService";
import { showSuccess, showApiError } from "@/utils/toast";

const props = defineProps({
  bom: Object,
  editMode: Boolean,
  productId: String,
  productName: String,
});
const emit = defineEmits(["close", "saved"]);

const form = ref({
  product_id: "",
  raw_material_id: "",
  qty: 1,
  unit: "",
});
const rawMaterials = ref([]);
const submitted = ref(false);
const loading = ref(false);

const fetchRawMaterials = async () => {
  const res = await getRawMaterials({ limit: 100 });
  rawMaterials.value = res.data?.rawMaterials || res.rawMaterials || res.data?.data || res.data || [];
};

const updateUnit = () => {
  const selected = rawMaterials.value.find((m) => m.id === form.value.raw_material_id);
  form.value.unit = selected?.unit || "";
};

const resetForm = () => {
  form.value = {
    product_id: props.editMode && props.bom ? props.bom.product_id : props.productId,
    raw_material_id: "",
    qty: 1,
    unit: "",
  };
  submitted.value = false;
};

watch(
  () => props.bom,
  (val) => {
    if (props.editMode && val) {
      form.value = {
        product_id: val.product_id,
        raw_material_id: val.raw_material_id,
        qty: val.qty,
        unit: val.unit || val.raw_material?.unit || "",
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  submitted.value = true;
  if (!form.value.product_id || !form.value.raw_material_id || !form.value.qty) return;
  emit("saved", { ...form.value });
  resetForm();
};
const closeDialog = () => {
  emit("close");
  resetForm();
};
onMounted(() => {
  fetchRawMaterials();
});
</script>
