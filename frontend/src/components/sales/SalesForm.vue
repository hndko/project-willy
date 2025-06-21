<template>
  <form @submit.prevent="submitForm" class="p-fluid">
    <div class="flex flex-col gap-4">
      <!-- Product Selection -->
      <div class="field">
        <label for="product" class="block mb-2 font-medium text-gray-700">Product</label>
        <Dropdown id="product" v-model="form.productId" :options="products" optionLabel="name" optionValue="id" placeholder="Select a product" class="w-full" :class="{ 'p-invalid': v$.productId.$invalid && submitted }" @change="handleProductChange" />
        <small v-if="v$.productId.$invalid && submitted" class="p-error">{{ v$.productId.$errors[0].$message }}</small>
      </div>

      <!-- Customer Selection -->
      <div class="field">
        <label for="customer" class="block mb-2 font-medium text-gray-700">Customer</label>
        <Dropdown id="customer" v-model="form.customerId" :options="customers" optionLabel="name" optionValue="id" placeholder="Select a customer" class="w-full" :class="{ 'p-invalid': v$.customerId.$invalid && submitted }" />
        <small v-if="v$.customerId.$invalid && submitted" class="p-error">{{ v$.customerId.$errors[0].$message }}</small>
      </div>

      <!-- Quantity -->
      <div class="field">
        <label for="qty" class="block mb-2 font-medium text-gray-700">Quantity</label>
        <InputNumber id="qty" v-model="form.qty" placeholder="Enter quantity" :min="1" :step="1" :class="{ 'p-invalid': v$.qty.$invalid && submitted }" @update:modelValue="calculateTotal" />
        <small v-if="v$.qty.$invalid && submitted" class="p-error">{{ v$.qty.$errors[0].$message }}</small>
        <small v-if="selectedProduct && form.qty > selectedProduct.stock" class="p-error">Only {{ selectedProduct.stock }} items in stock</small>
      </div>

      <!-- Price -->
      <div class="field">
        <label for="price" class="block mb-2 font-medium text-gray-700">Unit Price</label>
        <div class="p-inputgroup">
          <InputNumber id="price" v-model="form.price" placeholder="Enter price" :min="0" mode="currency" currency="IDR" locale="id-ID" :maxFractionDigits="0" :class="{ 'p-invalid': v$.price.$invalid && submitted }" @update:modelValue="calculateTotal" />
        </div>
        <small v-if="v$.price.$invalid && submitted" class="p-error">{{ v$.price.$errors[0].$message }}</small>
      </div>

      <!-- Discount -->
      <div class="field">
        <label for="discount" class="block mb-2 font-medium text-gray-700">Discount</label>
        <div class="p-inputgroup">
          <InputNumber id="discount" v-model="form.discount" placeholder="Enter discount" :min="0" mode="currency" currency="IDR" :maxFractionDigits="0" locale="id-ID" @update:modelValue="calculateTotal" />
        </div>
      </div>

      <!-- Shipping Cost -->
      <div class="field">
        <label for="shippingCost" class="block mb-2 font-medium text-gray-700">Shipping Cost</label>
        <div class="p-inputgroup">
          <InputNumber id="shippingCost" v-model="form.shippingCost" placeholder="Enter shipping cost" :min="0" mode="currency" currency="IDR" :maxFractionDigits="0" locale="id-ID" @update:modelValue="calculateTotal" />
        </div>
      </div>

      <!-- Admin Fee -->
      <div class="field">
        <label for="adminFee" class="block mb-2 font-medium text-gray-700">Admin Fee</label>
        <div class="p-inputgroup">
          <InputNumber id="adminFee" v-model="form.adminFee" placeholder="Enter admin fee" :min="0" mode="currency" currency="IDR" :maxFractionDigits="0" locale="id-ID" @update:modelValue="calculateTotal" />
        </div>
      </div>

      <!-- Tax -->
      <div class="field">
        <label for="tax" class="block mb-2 font-medium text-gray-700">Tax</label>
        <div class="p-inputgroup">
          <InputNumber id="tax" v-model="form.tax" placeholder="Enter tax amount" :min="0" mode="currency" currency="IDR" :maxFractionDigits="0" locale="id-ID" @update:modelValue="calculateTotal" />
        </div>
      </div>

      <!-- Total (Calculated) -->
      <div class="field">
        <label for="total" class="block mb-2 font-medium text-gray-700">Total</label>
        <div class="p-inputgroup">
          <InputNumber id="total" v-model="form.total" placeholder="Total amount" :min="0" :readonly="true" mode="currency" currency="IDR" :maxFractionDigits="0" locale="id-ID" />
        </div>
      </div>

      <!-- Payment Status -->
      <div class="field">
        <label for="paymentStatus" class="block mb-2 font-medium text-gray-700">Payment Status</label>
        <Dropdown id="paymentStatus" v-model="form.paymentStatus" :options="paymentStatusOptions" optionLabel="label" optionValue="value" placeholder="Select payment status" class="w-full" @change="handlePaymentStatusChange" />
      </div>

      <!-- Payment Method - Show only if payment status is not 'unpaid' -->
      <div class="field" v-if="form.paymentStatus && form.paymentStatus !== 'unpaid'">
        <label for="paymentMethod" class="block mb-2 font-medium text-gray-700">Payment Method</label>
        <Dropdown id="paymentMethod" v-model="form.paymentMethod" :options="paymentMethodOptions" optionLabel="label" optionValue="value" placeholder="Select payment method" class="w-full" />
      </div>

      <!-- Payment Date - Show only if payment status is not 'unpaid' -->
      <div class="field" v-if="form.paymentStatus && form.paymentStatus !== 'unpaid'">
        <label for="paymentDate" class="block mb-2 font-medium text-gray-700">Payment Date</label>
        <Calendar id="paymentDate" v-model="form.paymentDate" placeholder="Select payment date" :showIcon="true" :maxDate="maxDate" />
      </div>

      <!-- Date -->
      <div class="field">
        <label for="date" class="block mb-2 font-medium text-gray-700">Sale Date</label>
        <Calendar id="date" v-model="form.date" placeholder="Select sale date" :showIcon="true" :maxDate="maxDate" :class="{ 'p-invalid': v$.date.$invalid && submitted }" />
        <small v-if="v$.date.$invalid && submitted" class="p-error">{{ v$.date.$errors[0].$message }}</small>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end gap-2 mt-4">
        <Button type="button" label="Cancel" icon="pi pi-times" class="p-button-text" @click="$emit('cancel')" :disabled="loading" />
        <Button type="submit" label="Save" icon="pi pi-check" :loading="loading" />
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, minValue } from "@vuelidate/validators";
import { useConfirm } from "primevue/useconfirm";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import { createSale, updateSale } from "@/services/saleService";
import { getProducts } from "@/services/productService";
import { getCustomers } from "@/services/customerService";
import { format } from "date-fns";
import { showSuccess, showApiError } from "@/utils/toast";

const props = defineProps({
  sale: {
    type: Object,
    default: () => ({}),
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["save", "cancel", "openDelivery"]);
const confirm = useConfirm();
const loading = ref(false);
const submitted = ref(false);
const products = ref([]);
const customers = ref([]);
const maxDate = new Date();

// Payment status options
const paymentStatusOptions = ref([
  { label: "Unpaid", value: "unpaid" },
  { label: "Partially Paid", value: "partial" },
  { label: "Paid", value: "paid" },
]);

// Payment method options
const paymentMethodOptions = ref([
  { label: "Cash", value: "cash" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Credit Card", value: "credit_card" },
  { label: "Debit Card", value: "debit_card" },
  { label: "E-Wallet", value: "e_wallet" },
  { label: "Other", value: "other" },
]);

// Form model
const form = reactive({
  productId: "",
  customerId: "",
  qty: 1,
  price: 0,
  discount: 0,
  shippingCost: 0,
  adminFee: 0,
  tax: 0,
  total: 0,
  paymentStatus: "unpaid",
  paymentMethod: null,
  paymentDate: null,
  date: new Date(),
});

// Selected product for availability check
const selectedProduct = ref(null);

// Validation rules
const rules = {
  productId: { required },
  customerId: { required },
  qty: { required, minValue: minValue(1) },
  price: { required, minValue: minValue(0) },
  date: { required },
};

const v$ = useVuelidate(rules, form);

// Calculate total when quantity or price changes
const calculateTotal = () => {
  const subtotal = form.qty * form.price;
  const totalBeforeTax = subtotal - (form.discount || 0) + (form.shippingCost || 0) + (form.adminFee || 0);
  form.total = totalBeforeTax + (form.tax || 0);
};

// Handle product selection change
const handleProductChange = () => {
  const product = products.value.find((p) => p.id === form.productId);
  selectedProduct.value = product;
  if (product) {
    form.price = product.price;
    calculateTotal();
  }
};

// Handle payment status change
const handlePaymentStatusChange = () => {
  if (form.paymentStatus === "unpaid") {
    form.paymentMethod = null;
    form.paymentDate = null;
  } else if (!form.paymentDate) {
    form.paymentDate = new Date();
  }
};

// Load products and customers data
const loadFormData = async () => {
  try {
    loading.value = true;

    // Load products
    const productsResponse = await getProducts({ limit: 100 });
    products.value = productsResponse.data.products;

    // Load customers
    const customersResponse = await getCustomers({ limit: 100 });
    customers.value = customersResponse.data.customers;

    // Populate form if in edit mode
    if (props.isEdit && props.sale) {
      form.productId = props.sale.productId;
      form.customerId = props.sale.customerId;
      form.qty = props.sale.qty;
      form.price = props.sale.price;
      form.discount = props.sale.discount || 0;
      form.shippingCost = props.sale.shippingCost || 0;
      form.adminFee = props.sale.adminFee || 0;
      form.tax = props.sale.tax || 0;
      form.total = props.sale.total;
      form.paymentStatus = props.sale.paymentStatus || "unpaid";
      form.paymentMethod = props.sale.paymentMethod || null;
      form.paymentDate = props.sale.paymentDate ? new Date(props.sale.paymentDate) : null;
      form.date = new Date(props.sale.date);

      // Set selected product
      selectedProduct.value = products.value.find((p) => p.id === form.productId);
    }
  } catch (error) {
    console.error("Error loading form data:", error);
    showApiError("Gagal memuat data formulir");
  } finally {
    loading.value = false;
  }
};

// Form submission handler
const submitForm = async () => {
  submitted.value = true;
  const isFormValid = await v$.value.$validate();

  if (!isFormValid) {
    showApiError("Mohon periksa kembali isian formulir");
    return;
  }

  // Check if we have enough stock
  if (selectedProduct.value && form.qty > selectedProduct.value.stock) {
    showApiError(`Stok hanya tersedia ${selectedProduct.value.stock} item`);
    return;
  }

  try {
    loading.value = true;

    // Format the dates to ISO format for the backend
    const formData = { ...form };
    delete formData.userId;
    if (formData.date) {
      formData.date = format(formData.date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    }
    if (formData.paymentDate) {
      formData.paymentDate = format(formData.paymentDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    }

    let response;
    if (props.isEdit) {
      response = await updateSale(props.sale.id, formData);
      showSuccess("Penjualan berhasil diubah");
    } else {
      response = await createSale(formData);
      showSuccess("Penjualan berhasil ditambahkan");

      // Add toast for invoice creation
      if (response.invoice) {
        showSuccess(`Invoice ${response.invoice.invoiceNumber} berhasil dibuat otomatis`);
      } else if (response.invoiceError) {
        showApiError(response.invoiceError);
      }

      // After successful sale creation, ask if user wants to add delivery info
      confirm.require({
        message: "Apakah Anda ingin menambah data pengiriman untuk penjualan ini?",
        header: "Tambah Pengiriman",
        icon: "pi pi-truck",
        accept: () => {
          // Emit event to parent component to open delivery form
          emit("openDelivery", response.data);
        },
        reject: () => {
          // Just close the form as usual
          emit("save");
        },
      });

      // Return early to prevent the default emit("save")
      return;
    }

    emit("save");
  } catch (error) {
    console.error("Error saving sale:", error);
    let errorMessage = "Gagal menyimpan penjualan.";

    if (error.response && error.response.data) {
      if (error.response.data.message) {
        errorMessage += " " + error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage += " " + error.response.data.error;
      }
    }

    showApiError(errorMessage);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadFormData();
});
</script>
