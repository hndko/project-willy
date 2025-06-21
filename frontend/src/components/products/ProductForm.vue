<template>
  <Dialog :visible="visible" :style="{ width: '500px' }" :header="editMode ? 'Edit Product' : 'Add Product'" :modal="true" class="p-fluid" @update:visible="$emit('update:visible', $event)">
    <div class="p-4">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label for="name" class="block mb-2 font-medium text-gray-700">Name</label>
          <InputText id="name" v-model="form.name" :class="{ 'p-invalid': v$.name.$invalid && submitted }" placeholder="Enter product name" required />
          <small v-if="v$.name.$invalid && submitted" class="p-error">{{ v$.name.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="description" class="block mb-2 font-medium text-gray-700">Description</label>
          <Textarea id="description" v-model="form.description" rows="3" autoResize placeholder="Enter product description" />
          <small class="text-gray-500">Product description (optional)</small>
        </div>

        <div class="mb-4">
          <label for="price" class="block mb-2 font-medium text-gray-700">Price</label>
          <InputNumber id="price" v-model="form.price" mode="currency" currency="IDR" locale="id-ID" :minFractionDigits="0" :class="{ 'p-invalid': v$.price.$invalid && submitted }" placeholder="Enter price" required />
          <small v-if="v$.price.$invalid && submitted" class="p-error">{{ v$.price.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="stock" class="block mb-2 font-medium text-gray-700">Stock</label>
          <InputNumber id="stock" v-model="form.stock" disabled :class="{ 'p-invalid': v$.stock.$invalid && submitted }" placeholder="Enter stock amount" required />
          <p class="text-sm text-gray-500">Tambah & edit stock silahkan ke <a href="/stock" class="text-blue-500 hover:underline">Stock Management</a></p>
          <small v-if="v$.stock.$invalid && submitted" class="p-error">{{ v$.stock.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="sku" class="block mb-2 font-medium text-gray-700">SKU</label>
          <InputText id="sku" v-model="form.sku" :class="{ 'p-invalid': v$.sku.$invalid && submitted }" placeholder="Enter product SKU" required />
          <small v-if="v$.sku.$invalid && submitted" class="p-error">{{ v$.sku.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="category" class="block mb-2 font-medium text-gray-700">Category</label>
          <Dropdown id="category" v-model="form.categoryId" :options="categories" optionLabel="name" optionValue="id" placeholder="Select a category" :class="{ 'p-invalid': v$.categoryId.$invalid && submitted }" required />
          <small v-if="v$.categoryId.$invalid && submitted" class="p-error">{{ v$.categoryId.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="supplier" class="block mb-2 font-medium text-gray-700">Supplier</label>
          <Dropdown id="supplier" v-model="form.supplierId" :options="suppliers" optionLabel="name" optionValue="id" placeholder="Select a supplier" :class="{ 'p-invalid': v$.supplierId.$invalid && submitted }" required />
          <small v-if="v$.supplierId.$invalid && submitted" class="p-error">{{ v$.supplierId.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="image" class="block mb-2 font-medium text-gray-700">Product Image</label>
          <div class="flex flex-col gap-2">
            <FileUpload mode="basic" name="image" accept="image/*" :maxFileSize="2000000" chooseLabel="Browse" @select="onImageSelect" :class="{ 'p-invalid': v$.image.$invalid && submitted }" />
            <small class="text-gray-500">Max size: 2MB. Formats: jpg, png, jpeg</small>
            <small v-if="v$.image.$invalid && submitted" class="p-error">{{ v$.image.$errors[0].$message }}</small>

            <div v-if="imagePreview" class="mt-2">
              <img :src="imagePreview" class="object-cover w-24 h-24 rounded-md shadow-sm" />
            </div>
          </div>
        </div>

        <div class="mb-4">
          <label for="is_active" class="block mb-2 font-medium text-gray-700">Status</label>
          <div class="flex items-center gap-3">
            <InputSwitch v-model="form.is_active" inputId="is_active" />
            <span>{{ form.is_active ? "Active" : "Inactive" }}</span>
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
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { useVuelidate } from "@vuelidate/core";
import { required, minValue } from "@vuelidate/validators";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import Dropdown from "primevue/dropdown";
import FileUpload from "primevue/fileupload";
import InputSwitch from "primevue/inputswitch";
import Button from "primevue/button";
import { createProduct, updateProduct } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { getSuppliers } from "@/services/supplierService";
import { showSuccess, showApiError } from "@/utils/toast";

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
const editMode = computed(() => !!props.editData);
const categories = ref([]);
const suppliers = ref([]);
const imagePreview = ref(null);

// Form data initialization
const form = reactive({
  name: "",
  description: "",
  price: 0,
  stock: 0,
  sku: "",
  categoryId: "",
  supplierId: "",
  image: null,
  is_active: true,
});

// Validation rules
const rules = computed(() => {
  const imageRule = editMode.value && !form.image ? {} : { required };

  return {
    name: { required },
    price: { required, minValue: minValue(0) },
    stock: { required, minValue: minValue(0) },
    sku: { required },
    categoryId: { required },
    supplierId: { required },
    image: imageRule,
  };
});

const v$ = useVuelidate(rules, form);

// Load categories and suppliers
const loadCategories = async () => {
  try {
    const response = await getCategories();
    if (response.status === "Success" && Array.isArray(response.data)) {
      categories.value = response.data;
    } else {
      categories.value = [];
    }
    console.log("Categories loaded:", categories.value);
  } catch (error) {
    console.error("Error loading categories:", error);
    showApiError("Gagal memuat kategori");
  }
};

const loadSuppliers = async () => {
  try {
    const response = await getSuppliers();
    if (response.status === "Success" && Array.isArray(response.data)) {
      suppliers.value = response.data;
    } else {
      suppliers.value = [];
    }
    console.log("Suppliers loaded:", suppliers.value);
  } catch (error) {
    console.error("Error loading suppliers:", error);
    showApiError("Gagal memuat supplier");
  }
};

// Reset form to initial state
const resetForm = () => {
  form.name = "";
  form.description = "";
  form.price = 0;
  form.stock = 0;
  form.sku = "";
  form.categoryId = "";
  form.supplierId = "";
  form.image = null;
  form.is_active = true;
  imagePreview.value = null;
  submitted.value = false;
  v$.value.$reset();
};

// Handle image selection
const onImageSelect = (event) => {
  const file = event.files[0];
  form.image = file;

  // Create image preview
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Set form data when editing
const setFormData = () => {
  if (props.editData) {
    form.name = props.editData.name;
    form.description = props.editData.description || "";
    form.price = props.editData.price;
    form.stock = props.editData.stock;
    form.sku = props.editData.sku;
    form.categoryId = props.editData.Category?.id || "";
    form.supplierId = props.editData.Supplier?.id || "";
    form.is_active = props.editData.is_active;

    // Set image preview for existing image
    if (props.editData.image) {
      imagePreview.value = `/uploads/${props.editData.image}`;
    }
  }
};

// Submit form
const submitForm = async () => {
  submitted.value = true;
  const isValid = await v$.value.$validate();

  if (!isValid) return;

  try {
    loading.value = true;

    if (editMode.value) {
      await updateProduct(props.editData.id, form);
      showSuccess("Produk berhasil diubah");
    } else {
      await createProduct(form);
      showSuccess("Produk berhasil ditambahkan");
    }

    emit("refresh");
    emit("update:visible", false);
    resetForm();
  } catch (error) {
    console.error("Error saving product:", error);
    showApiError("Gagal menyimpan produk");
  } finally {
    loading.value = false;
  }
};

// Initialize component
onMounted(async () => {
  await Promise.all([loadCategories(), loadSuppliers()]);
});

// Watch for dialog visibility changes
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      Promise.all([loadCategories(), loadSuppliers()]);
      if (props.editData) {
        setFormData();
      }
    } else if (!newVal) {
      resetForm();
    }
  }
);

// Watch for edit data changes
watch(
  () => props.editData,
  (newVal) => {
    if (newVal && props.visible) {
      setFormData();
    }
  }
);
</script>
