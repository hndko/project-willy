<template>
  <form @submit.prevent="handleSubmit" class="w-full p-4 bg-white rounded-lg shadow">
    <div class="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
      <div class="flex flex-col gap-2">
        <label class="block font-medium">Product *</label>
        <Dropdown v-model="form.product_id" :options="products" optionLabel="name" optionValue="id" placeholder="Select Product" class="w-full" :class="{ 'p-invalid border-red-500': submitted && !form.product_id }" />
        <small v-if="submitted && !form.product_id" class="text-red-500">Product is required</small>
      </div>
      <div class="flex flex-col gap-2">
        <label class="block font-medium">Production Date *</label>
        <Calendar v-model="form.production_date" dateFormat="dd/mm/yy" showIcon class="w-full" :class="{ 'p-invalid border-red-500': submitted && !form.production_date }" />
        <small v-if="submitted && !form.production_date" class="text-red-500">Production date is required</small>
      </div>
      <div class="flex flex-col gap-2">
        <label class="block font-medium">Quantity *</label>
        <input v-model.number="form.qty" type="number" min="1" class="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400" :class="{ 'border-red-500': submitted && !form.qty }" />
        <small v-if="submitted && !form.qty" class="text-red-500">Quantity is required</small>
      </div>
      <div class="flex flex-col gap-2">
        <label class="block font-medium">Notes</label>
        <Textarea v-model="form.notes" autoResize rows="2" class="w-full" placeholder="Additional notes (optional)" />
      </div>
    </div>
    <div class="pt-6 mt-2 border-t">
      <h3 class="mb-3 text-base font-semibold">Raw Material Composition (BoM)</h3>
      <BoMTable :boms="bomList" :loading="bomLoading" @add="openAddBoMDialog" @edit="openEditBoMDialog" @delete="deleteBoM" />
      <div v-if="bomWarning" class="flex items-center gap-2 mt-2 text-sm font-semibold text-red-600"><i class="pi pi-exclamation-triangle"></i> {{ bomWarning }}</div>
    </div>
    <Dialog v-model:visible="showBoMDialog" :header="bomEditMode ? 'Edit BoM' : 'Add BoM'" :style="{ width: '400px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <BoMForm :bom="selectedBoM" :editMode="bomEditMode" @close="closeBoMDialog" @saved="handleBoMSaved" ref="bomFormRef" />
    </Dialog>
    <div class="flex justify-between gap-2 mt-8">
      <Button type="button" label="Cancel" icon="pi pi-times" outlined @click="closeDialog" class="text-gray-700 bg-gray-200" />
      <Button type="submit" label="Save" icon="pi pi-check" class="text-white bg-primary" :loading="loading" :disabled="!!bomWarning" />
    </div>
  </form>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import Button from "primevue/button";
import Textarea from "primevue/textarea";
import Dialog from "primevue/dialog";
import { showSuccess, showApiError } from "@/utils/toast";
import { getProducts } from "@/services/productService";
import BoMTable from "@/components/boms/BoMTable.vue";
import BoMForm from "@/components/boms/BoMForm.vue";
import { getBoMByProduct } from "@/services/bomService";
import { getRawMaterials } from "@/services/rawMaterialService";
import { user as authUser } from "@/stores/auth/state";

const props = defineProps({
  production: Object,
  editMode: Boolean,
});
const emit = defineEmits(["close", "saved"]);

const form = ref({
  product_id: "",
  qty: 1,
  production_date: new Date(),
  notes: "",
});
const products = ref([]);
const submitted = ref(false);
const loading = ref(false);
const bomList = ref([]);
const bomLoading = ref(false);
const rawMaterialsMap = ref({});
const bomWarning = ref("");

// BoM dialog state
const showBoMDialog = ref(false);
const bomEditMode = ref(false);
const selectedBoM = ref(null);

const openAddBoMDialog = async () => {
  selectedBoM.value = null;
  bomEditMode.value = false;
  showBoMDialog.value = true;
  await nextTick();
  // Refetch raw materials for BoMForm
  if (bomFormRef.value && bomFormRef.value.fetchRawMaterials) bomFormRef.value.fetchRawMaterials();
};
const openEditBoMDialog = async (bom) => {
  selectedBoM.value = { ...bom };
  bomEditMode.value = true;
  showBoMDialog.value = true;
  await nextTick();
  if (bomFormRef.value && bomFormRef.value.fetchRawMaterials) bomFormRef.value.fetchRawMaterials();
};
const closeBoMDialog = () => {
  showBoMDialog.value = false;
  selectedBoM.value = null;
  bomEditMode.value = false;
};
const handleBoMSaved = (bom) => {
  if (bomEditMode.value && selectedBoM.value) {
    // Edit existing
    const idx = bomList.value.findIndex((b) => b.raw_material_id === selectedBoM.value.raw_material_id);
    if (idx !== -1) bomList.value[idx] = { ...bom };
  } else {
    // Add new
    bomList.value.push({ ...bom });
  }
  closeBoMDialog();
};
const deleteBoM = (bom) => {
  bomList.value = bomList.value.filter((b) => b.raw_material_id !== bom.raw_material_id);
};

const fetchProducts = async () => {
  try {
    const res = await getProducts({ limit: 100 });
    products.value = res.data?.products || res.products || res.data || res || [];
  } catch (e) {
    products.value = [];
    showApiError(e);
  }
};

const resetForm = () => {
  form.value = {
    product_id: "",
    qty: 1,
    production_date: new Date(),
    notes: "",
  };
  submitted.value = false;
};

watch(
  () => props.production,
  (val) => {
    if (props.editMode && val) {
      form.value = {
        product_id: val.product_id,
        qty: val.qty,
        production_date: val.production_date ? new Date(val.production_date) : new Date(),
        notes: val.notes || "",
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const fetchBoM = async (productId, qty) => {
  if (!productId) {
    bomList.value = [];
    bomWarning.value = "";
    return;
  }
  bomLoading.value = true;
  try {
    const res = await getBoMByProduct(productId);
    const rawRes = await getRawMaterials({ limit: 100 });
    rawMaterialsMap.value = {};
    (rawRes.data?.rawMaterials || rawRes.rawMaterials || rawRes.data?.data || rawRes.data || []).forEach((m) => {
      rawMaterialsMap.value[m.id] = m;
    });
    bomList.value = (res.data?.data || res.data || res || []).map((bom) => ({
      ...bom,
      raw_material_name: bom.RawMaterial?.name || rawMaterialsMap.value[bom.raw_material_id]?.name || bom.raw_material_id,
    }));
    bomWarning.value = "";
    for (const bom of bomList.value) {
      const material = rawMaterialsMap.value[bom.raw_material_id];
      const need = bom.qty * (qty || 1);
      if (material && material.stock < need) {
        bomWarning.value = `Insufficient stock for ${material.name} (${material.stock} available, need ${need})`;
        break;
      }
      if (material && bom.unit !== material.unit) {
        bom.unit = material.unit;
      }
    }
  } catch (e) {
    bomList.value = [];
    showApiError(e);
  } finally {
    bomLoading.value = false;
  }
};

watch(
  () => [form.value.product_id, form.value.qty],
  ([productId, qty]) => {
    fetchBoM(productId, qty);
  },
  { immediate: true }
);

const handleSubmit = async () => {
  submitted.value = true;
  if (!form.value.product_id || !form.value.qty || !form.value.production_date) {
    showApiError("Product, quantity, and production date are required");
    return;
  }
  const user_id = authUser.value?.id;
  if (!user_id) {
    showApiError("User not authenticated");
    return;
  }
  loading.value = true;
  try {
    const payload = {
      ...form.value,
      user_id,
    };
    emit("saved", payload);
  } catch (e) {
    showApiError(e);
  } finally {
    loading.value = false;
  }
};
const closeDialog = () => {
  emit("close");
  resetForm();
};
onMounted(fetchProducts);

// Ref for BoMForm to call fetchRawMaterials
const bomFormRef = ref(null);
</script>
