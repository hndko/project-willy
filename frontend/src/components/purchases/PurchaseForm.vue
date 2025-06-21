<template>
  <form @submit.prevent="handleSubmit" class="w-auto p-6 mx-auto bg-white rounded-lg shadow-md p-fluid">
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <div class="mb-6">
          <label for="rawMaterial" class="block mb-1 font-medium">Raw Material *</label>
          <Dropdown id="rawMaterial" v-model="form.rawMaterialId" :options="rawMaterials" optionLabel="name" optionValue="id" placeholder="Select Raw Material" :class="{ 'p-invalid': submitted && !form.rawMaterialId }" class="w-full" />
          <small v-if="submitted && !form.rawMaterialId" class="p-error">Raw Material is required</small>
        </div>
        <div class="mb-6">
          <label for="supplier" class="block mb-1 font-medium">Supplier *</label>
          <Dropdown id="supplier" v-model="form.supplierId" :options="suppliers" optionLabel="name" optionValue="id" placeholder="Select Supplier" :class="{ 'p-invalid': submitted && !form.supplierId }" class="w-full" />
          <small v-if="submitted && !form.supplierId" class="p-error">Supplier is required</small>
        </div>
        <div class="mb-6">
          <label for="qty" class="block mb-1 font-medium">Quantity *</label>
          <InputNumber
            id="qty"
            v-model="form.qty"
            placeholder="Enter quantity"
            :min="1"
            :showButtons="true"
            buttonLayout="horizontal"
            decrementButtonClass="p-button-danger"
            incrementButtonClass="p-button-success"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            @input="calculateTotal"
            :class="{ 'p-invalid': submitted && !form.qty }"
            class="w-4/12"
          />
          <small v-if="submitted && !form.qty" class="p-error">Quantity is required</small>
        </div>
        <div class="mb-6">
          <label for="price" class="block mb-1 font-medium">Price per Unit *</label>
          <InputNumber id="price" v-model="form.price" mode="currency" currency="IDR" locale="id-ID" placeholder="Enter price" :min="0" @input="calculateTotal" :class="{ 'p-invalid': submitted && !form.price }" class="w-full" :minFractionDigits="0" :maxFractionDigits="0" />
          <small v-if="submitted && !form.price" class="p-error">Price is required</small>
        </div>
        <div class="mb-6">
          <label for="total" class="block mb-1 font-medium">Total Amount</label>
          <InputNumber id="total" v-model="form.total" mode="currency" currency="IDR" locale="id-ID" readonly disabled class="w-full bg-gray-100" :minFractionDigits="0" :maxFractionDigits="0" />
        </div>
      </div>
      <div>
        <div class="mb-6">
          <label for="date" class="block mb-1 font-medium">Purchase Date *</label>
          <Calendar id="date" v-model="form.date" dateFormat="dd/mm/yy" placeholder="Select date" :showIcon="true" :maxDate="new Date()" :class="{ 'p-invalid': submitted && !form.date }" class="w-full" />
          <small v-if="submitted && !form.date" class="p-error">Date is required</small>
        </div>
        <div class="mb-6">
          <label for="status" class="block mb-1 font-medium">Status *</label>
          <Dropdown id="status" v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Select Status" :class="{ 'p-invalid': submitted && !form.status }" class="w-full" />
          <small v-if="submitted && !form.status" class="p-error">Status is required</small>
        </div>
        <div class="mb-6">
          <label for="invoiceNumber" class="block mb-1 font-medium">Invoice Number</label>
          <InputText id="invoiceNumber" v-model="form.invoiceNumber" placeholder="Invoice number (optional)" class="w-full" />
        </div>
        <div class="mb-6">
          <label for="receivedDate" class="block mb-1 font-medium">Received Date</label>
          <Calendar id="receivedDate" v-model="form.receivedDate" dateFormat="dd/mm/yy" placeholder="Select received date (optional)" :showIcon="true" class="w-full" />
        </div>
        <div class="mb-6">
          <label for="notes" class="block mb-1 font-medium">Notes</label>
          <Textarea id="notes" v-model="form.notes" placeholder="Enter notes (optional)" autoResize rows="2" class="w-full" />
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <Button type="button" label="Cancel" icon="pi pi-times" outlined @click="closeDialog" :disabled="loading" class="text-gray-700 bg-gray-200" />
      <Button type="submit" label="Save" icon="pi pi-check" :loading="loading" class="text-white bg-primary" />
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { showSuccess, showApiError } from "@/utils/toast";
import Dropdown from "primevue/dropdown";
import InputNumber from "primevue/inputnumber";
import Calendar from "primevue/calendar";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import { createPurchase, updatePurchase } from "@/services/purchaseService";
import { getRawMaterials } from "@/services/rawMaterialService";
import { getSuppliers } from "@/services/supplierService";
import { useAuthStore } from "@/stores/auth/indexAuth";

const props = defineProps({
  purchase: {
    type: Object,
    default: () => ({}),
  },
  editMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "saved"]);
const authStore = useAuthStore();

const form = ref({
  rawMaterialId: "",
  supplierId: "",
  userId: authStore.user?.id || "",
  qty: 1,
  price: 0,
  total: 0,
  date: new Date(),
  status: "pending",
  invoiceNumber: "",
  notes: "",
  receivedDate: null,
});

const rawMaterials = ref([]);
const suppliers = ref([]);
const submitted = ref(false);
const loading = ref(false);
const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Canceled", value: "canceled" },
];

// Calculate total whenever qty or price changes
const calculateTotal = () => {
  if (form.value.qty && form.value.price) {
    form.value.total = form.value.qty * form.value.price;
  } else {
    form.value.total = 0;
  }
};

// Watch for qty and price changes to calculate total
watch([() => form.value.qty, () => form.value.price], calculateTotal);

// Reset form to defaults
const resetForm = () => {
  form.value = {
    rawMaterialId: "",
    supplierId: "",
    userId: authStore.user?.id || "",
    qty: 1,
    price: 0,
    total: 0,
    date: new Date(),
    status: "pending",
    invoiceNumber: "",
    notes: "",
    receivedDate: null,
  };
  submitted.value = false;
};

// Watch for changes in purchase prop and populate form
watch(
  () => props.purchase,
  (newVal) => {
    if (props.editMode && newVal && Object.keys(newVal).length > 0) {
      form.value = {
        rawMaterialId: newVal.rawMaterialId || newVal.raw_material_id,
        supplierId: newVal.supplierId || newVal.supplier_id,
        userId: newVal.userId || newVal.user_id || authStore.user?.id,
        qty: newVal.qty || 1,
        price: newVal.price || 0,
        total: newVal.total || 0,
        date: newVal.date ? new Date(newVal.date) : new Date(),
        status: newVal.status || "pending",
        invoiceNumber: newVal.invoiceNumber || newVal.invoice_number || "",
        notes: newVal.notes || "",
        receivedDate: newVal.receivedDate ? new Date(newVal.receivedDate) : newVal.received_date ? new Date(newVal.received_date) : null,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Fetch raw materials and suppliers
const fetchDropdownData = async () => {
  try {
    // Adding logging to debug the responses
    console.log("Fetching dropdown data...");

    const materialsResponse = await getRawMaterials({ limit: 100 });
    console.log("Raw materials response:", materialsResponse);

    const suppliersResponse = await getSuppliers({ limit: 100 });
    console.log("Suppliers response:", suppliersResponse);

    // Check the structure of the API responses and extract data properly
    if (materialsResponse.data && suppliersResponse.data) {
      // Handle different API response structures
      if (materialsResponse.data.rawMaterials) {
        rawMaterials.value = materialsResponse.data.rawMaterials;
      } else if (Array.isArray(materialsResponse.data.data)) {
        rawMaterials.value = materialsResponse.data.data;
      } else if (Array.isArray(materialsResponse.data)) {
        rawMaterials.value = materialsResponse.data;
      }

      // Same for suppliers
      if (suppliersResponse.data.suppliers) {
        suppliers.value = suppliersResponse.data.suppliers;
      } else if (Array.isArray(suppliersResponse.data.data)) {
        suppliers.value = suppliersResponse.data.data;
      } else if (Array.isArray(suppliersResponse.data)) {
        suppliers.value = suppliersResponse.data;
      }

      console.log("Processed raw materials:", rawMaterials.value);
      console.log("Processed suppliers:", suppliers.value);
    }
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    if (error.response) {
      console.error("API error response:", error.response.data);
    }
    showApiError("Failed to load form data");
  }
};

// Handle form submission
const handleSubmit = async () => {
  submitted.value = true;
  // Pastikan userId selalu ada
  if (!form.value.userId) {
    form.value.userId = authStore.user?.id || "";
  }
  // Format date dan receivedDate ke ISO string
  const payload = { ...form.value };
  if (payload.date instanceof Date) {
    payload.date = payload.date.toISOString();
  }
  if (payload.receivedDate instanceof Date) {
    payload.receivedDate = payload.receivedDate.toISOString();
  }
  // Hapus invoiceNumber jika kosong
  if (!payload.invoiceNumber || payload.invoiceNumber.trim() === "") {
    delete payload.invoiceNumber;
  }
  // Validate form
  if (!payload.rawMaterialId || !payload.supplierId || !payload.qty || !payload.price || !payload.date || !payload.status) {
    showApiError("Please fill all required fields");
    return;
  }
  loading.value = true;
  try {
    let response;
    if (props.editMode) {
      response = await updatePurchase(props.purchase.id, payload);
      showSuccess("Purchase updated successfully");
    } else {
      response = await createPurchase(payload);
      showSuccess("Purchase created successfully");
    }
    emit("saved", response.data);
    resetForm();
  } catch (error) {
    console.error("Error saving purchase:", error);
    showApiError("An error occurred while saving");
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  emit("close");
  resetForm();
};

onMounted(() => {
  fetchDropdownData();
});
</script>
