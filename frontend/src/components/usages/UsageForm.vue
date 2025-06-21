<template>
  <Dialog :visible="visible" :style="{ width: '450px' }" :header="editMode ? 'Edit Usage' : 'Add Usage'" :modal="true" class="p-fluid" @update:visible="$emit('update:visible', $event)">
    <div class="p-4">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label for="rawMaterialId" class="block mb-2 font-medium text-gray-700">Raw Material</label>
          <Dropdown id="rawMaterialId" v-model="usage.rawMaterialId" :options="rawMaterials" optionLabel="name" optionValue="id" placeholder="Select Raw Material" :class="{ 'p-invalid': submitted && !usage.rawMaterialId }" :filter="true" :loading="loadingRawMaterials" />
          <small v-if="submitted && !usage.rawMaterialId" class="p-error">Raw material is required</small>
        </div>

        <div class="mb-4">
          <label for="qty" class="block mb-2 font-medium text-gray-700">Quantity</label>
          <InputNumber id="qty" v-model="usage.qty" :class="{ 'p-invalid': submitted && !usage.qty }" placeholder="Enter quantity" :min="1" required />
          <small v-if="submitted && !usage.qty" class="p-error">Quantity is required and must be at least 1</small>
        </div>

        <div class="mb-4">
          <label for="date" class="block mb-2 font-medium text-gray-700">Date</label>
          <Calendar id="date" v-model="usage.date" :class="{ 'p-invalid': submitted && !usage.date }" dateFormat="dd/mm/yy" showTime :maxDate="today" placeholder="Select date and time" required />
          <small v-if="submitted && !usage.date" class="p-error">Date is required</small>
        </div>

        <div class="mb-4">
          <label for="description" class="block mb-2 font-medium text-gray-700">Description (Optional)</label>
          <Textarea id="description" v-model="usage.description" rows="3" placeholder="Enter description (optional)" />
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
import { ref, computed, watch, onMounted } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import Calendar from "primevue/calendar";
import Dropdown from "primevue/dropdown";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import { createUsage, updateUsage } from "@/services/usageService";
import { getRawMaterials } from "@/services/rawMaterialService";
import api from "@/services/api";

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

const toast = useToast();
const loading = ref(false);
const loadingRawMaterials = ref(false);
const submitted = ref(false);
const rawMaterials = ref([]);
const today = new Date();

const usage = ref({
  rawMaterialId: null,
  qty: 1,
  date: new Date(),
  description: "",
});

const editMode = computed(() => !!props.editData);

// Load raw materials for dropdown
const loadRawMaterials = async () => {
  try {
    loadingRawMaterials.value = true;
    const response = await getRawMaterials({
      is_active: true,
      limit: 100, // Get all active raw materials
    });
    rawMaterials.value = response.data.rawMaterials || [];
  } catch (error) {
    console.error("Error loading raw materials:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal memuat bahan baku",
      life: 3000,
    });
  } finally {
    loadingRawMaterials.value = false;
  }
};

// Define resetForm before it's used in the watch function
const resetForm = () => {
  usage.value = {
    rawMaterialId: null,
    qty: 1,
    date: new Date(),
    description: "",
  };
  submitted.value = false;
};

// Watch for changes in the editData prop
watch(
  () => props.editData,
  (newVal) => {
    if (newVal) {
      usage.value = {
        ...newVal,
        // Ensure date is a Date object
        date: newVal.date ? new Date(newVal.date) : new Date(),
      };
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
    if (newVal) {
      // Load raw materials when form opens
      loadRawMaterials();
    } else {
      resetForm();
    }
  }
);

const submitForm = async () => {
  submitted.value = true;

  if (!usage.value.rawMaterialId || !usage.value.qty || !usage.value.date) {
    return;
  }

  try {
    loading.value = true;

    // Get the current user info from the server
    try {
      const userResponse = await api.get("/profile");
      if (userResponse.data && userResponse.data.data) {
        usage.value.userId = userResponse.data.data.user_id;
      }
    } catch (userError) {
      console.error("Error getting user info:", userError);
      // If we can't get the user ID, show an error
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Gagal memuat informasi pengguna. Silakan coba lagi atau muat ulang halaman.",
        life: 3000,
      });
      loading.value = false;
      return;
    }

    if (!usage.value.userId) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "User ID tidak ditemukan. Silakan muat ulang halaman dan coba lagi.",
        life: 3000,
      });
      loading.value = false;
      return;
    }

    if (editMode.value) {
      await updateUsage(usage.value.id, usage.value);
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Penggunaan berhasil diubah",
        life: 3000,
      });
    } else {
      await createUsage(usage.value);
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Penggunaan berhasil ditambahkan",
        life: 3000,
      });
    }

    // Tutup form dan refresh tabel
    emit("update:visible", false);
    emit("refresh");

    // Pastikan refresh tabel terjadi dengan timeout
    setTimeout(() => {
      emit("refresh");
    }, 300);

    resetForm();
  } catch (error) {
    console.error("Error saving usage:", error);
    let errorMsg = "Gagal menyimpan penggunaan";
    if (error.response && error.response.data && (error.response.data.message || error.response.data.error)) {
      errorMsg = error.response.data.message || error.response.data.error;
    } else if (error.message) {
      errorMsg = error.message;
    }
    toast.add({
      severity: "error",
      summary: "Error",
      detail: errorMsg,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Load raw materials on component mount
  if (props.visible) {
    loadRawMaterials();
  }
});
</script>
