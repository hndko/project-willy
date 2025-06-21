<template>
  <form @submit.prevent="submitForm" class="p-fluid">
    <div class="flex flex-col gap-4">
      <!-- Sale Information Display (Read-only) -->
      <div class="p-4 rounded-lg field bg-gray-50">
        <h3 class="mb-2 text-lg font-semibold">Sale Information</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p><strong>Product:</strong> {{ sale?.Product?.name || "N/A" }}</p>
            <p><strong>Customer:</strong> {{ sale?.Customer?.name || "N/A" }}</p>
            <p><strong>Quantity:</strong> {{ sale?.qty || "0" }}</p>
          </div>
          <div>
            <p><strong>Date:</strong> {{ formatDate(sale?.date) }}</p>
            <p><strong>Total:</strong> {{ formatPrice(sale?.total || 0) }}</p>
            <p><strong>Sale ID:</strong> {{ sale?.id || "N/A" }}</p>
          </div>
        </div>
      </div>

      <!-- Status -->
      <div class="field">
        <label for="status" class="block mb-2 font-medium text-gray-700">Status</label>
        <Dropdown id="status" v-model="form.status" :options="statusOptions" optionLabel="name" optionValue="value" placeholder="Select status" class="w-full" :class="{ 'p-invalid': v$.status.$invalid && submitted }" />
        <small v-if="v$.status.$invalid && submitted" class="p-error">{{ v$.status.$errors[0].$message }}</small>
      </div>

      <!-- Shipping Address -->
      <div class="field">
        <label for="shippingAddress" class="block mb-2 font-medium text-gray-700">Shipping Address</label>
        <Textarea id="shippingAddress" v-model="form.shippingAddress" rows="4" placeholder="Enter shipping address" class="w-full" :class="{ 'p-invalid': v$.shippingAddress.$invalid && submitted }" />
        <small v-if="v$.shippingAddress.$invalid && submitted" class="p-error">{{ v$.shippingAddress.$errors[0].$message }}</small>
      </div>

      <!-- Shipping Method -->
      <div class="field">
        <label for="shippingMethod" class="block mb-2 font-medium text-gray-700">Shipping Method</label>
        <Dropdown id="shippingMethod" v-model="form.shippingMethod" :options="shippingMethodOptions" optionLabel="label" optionValue="value" placeholder="Select shipping method" class="w-full" />
      </div>

      <!-- Courier (Dropdown) -->
      <div class="field">
        <label for="courier" class="block mb-2 font-medium text-gray-700">Courier</label>
        <Dropdown id="courier" v-model="form.courier" :options="courierOptions" optionLabel="label" optionValue="value" placeholder="Select courier" class="w-full" :disabled="isPickupOrOffline" />
      </div>

      <!-- Tracking Number -->
      <div class="field">
        <label for="trackingNumber" class="block mb-2 font-medium text-gray-700">Tracking Number</label>
        <InputText id="trackingNumber" v-model="form.trackingNumber" placeholder="Enter tracking number" class="w-full" :disabled="isPickupOrOffline" />
      </div>

      <!-- Scheduled Date -->
      <div class="field">
        <label for="scheduledDate" class="block mb-2 font-medium text-gray-700">Scheduled Date</label>
        <Calendar id="scheduledDate" v-model="form.scheduledDate" placeholder="Select scheduled date" :showIcon="true" :minDate="new Date()" dateFormat="dd/mm/yy" class="w-full" />
      </div>

      <!-- Notes -->
      <div class="field">
        <label for="notes" class="block mb-2 font-medium text-gray-700">Notes</label>
        <Textarea id="notes" v-model="form.notes" rows="3" placeholder="Enter any additional notes" class="w-full" />
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
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { showSuccess, showApiError } from "@/utils/toast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import { format } from "date-fns";
import { createDelivery, updateDelivery, getDeliveryBySaleId } from "@/services/deliveryService";
import { user } from "@/stores/auth/state";

const props = defineProps({
  sale: {
    type: Object,
    required: true,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  deliveryId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["save", "cancel"]);
const loading = ref(false);
const submitted = ref(false);
const existingDelivery = ref(null);

// Status options
const statusOptions = [
  { name: "Pending", value: "pending" },
  { name: "Processing", value: "processing" },
  { name: "Shipped", value: "shipped" },
  { name: "Delivered", value: "delivered" },
  { name: "Cancelled", value: "cancelled" },
  { name: "Pickup (Ambil di Toko)", value: "pickup" },
  { name: "Offline", value: "offline" },
];

// Shipping method options - convert to proper dropdown options format
const shippingMethodOptions = ref([
  { label: "Cash On Delivery (COD)", value: "COD" },
  { label: "Regular Shipping", value: "Regular" },
  { label: "Next Day Delivery", value: "Next Day" },
  { label: "Instant Delivery", value: "Instant" },
]);

// Courier options
const courierOptions = [
  { label: "JNE", value: "jne" },
  { label: "J&T", value: "jnt" },
  { label: "Shopee Express", value: "shopee" },
];

// Form model
const form = reactive({
  saleId: props.sale?.id || "",
  userId: user.value?.id || "",
  status: "pending",
  shippingAddress: "",
  shippingMethod: "",
  courier: "",
  trackingNumber: "",
  scheduledDate: null,
  deliveryDate: null,
  notes: "",
});

// Validation rules
const rules = {
  status: { required },
  shippingAddress: { required },
};

const v$ = useVuelidate(rules, form);

// Format price for display
const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Format date for display
const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    return dateString;
  }
};

// Check if delivery already exists for this sale
const checkExistingDelivery = async () => {
  if (!props.sale?.id) return;

  try {
    loading.value = true;
    const response = await getDeliveryBySaleId(props.sale.id);

    // Check if we got a not found response or null data
    if (response.status === "NotFound" || !response.data) {
      console.log("No existing delivery found for this sale (expected)");
      existingDelivery.value = null;
      return;
    }

    // We have an existing delivery
    existingDelivery.value = response.data;

    // Populate form with existing data
    if (existingDelivery.value) {
      const delivery = existingDelivery.value;
      form.saleId = delivery.sale_id || delivery.saleId;
      form.userId = delivery.user_id || delivery.userId;
      form.status = delivery.status;
      form.shippingAddress = delivery.shipping_address || delivery.shippingAddress;
      form.shippingMethod = delivery.shipping_method || delivery.shippingMethod;
      form.courier = delivery.courier;
      form.trackingNumber = delivery.tracking_number || delivery.trackingNumber;
      form.scheduledDate = delivery.scheduled_date || delivery.scheduledDate ? new Date(delivery.scheduled_date || delivery.scheduledDate) : null;
      form.deliveryDate = delivery.delivery_date || delivery.deliveryDate ? new Date(delivery.delivery_date || delivery.deliveryDate) : null;
      form.notes = delivery.notes;
    }
  } catch (error) {
    // Only log real errors, not "not found" case
    console.error("Error checking for existing delivery:", error);
    showApiError("Failed to check existing delivery information");
  } finally {
    loading.value = false;
  }
};

// Form submission handler
const submitForm = async () => {
  submitted.value = true;
  const isFormValid = await v$.value.$validate();

  if (!isFormValid) {
    showApiError("Please check the form for errors");
    return;
  }

  // Ensure sale ID is present and valid
  if (!form.saleId) {
    console.error("Missing sale ID:", form.saleId);
    showApiError("Sale ID is missing. Cannot create delivery without a valid sale.");
    return;
  }

  // Ensure user ID is present
  if (!form.userId) {
    console.error("Missing user ID. Current user:", user.value);
    showApiError("User ID is missing. Please log out and log in again.");
    return;
  }

  try {
    loading.value = true;

    // Sanitize dates to ensure they're in ISO format
    const sanitizeDate = (date) => {
      if (!date) return null;
      if (date instanceof Date) {
        return date.toISOString();
      }
      return date;
    };

    // Convert camelCase form fields to snake_case for API
    const deliveryData = {
      sale_id: form.saleId,
      user_id: form.userId,
      status: form.status,
      shipping_address: form.shippingAddress,
      shipping_method: form.shippingMethod || "",
      courier: form.courier || "",
      tracking_number: form.trackingNumber || "",
      scheduled_date: sanitizeDate(form.scheduledDate),
      delivery_date: sanitizeDate(form.deliveryDate),
      notes: form.notes || "",
    };

    // Log the exact data being sent
    console.log("Submitting delivery data (formatted for API):", deliveryData);

    let response;
    if (existingDelivery.value) {
      // Update existing delivery
      console.log("Updating existing delivery ID:", existingDelivery.value.id);
      response = await updateDelivery(existingDelivery.value.id, deliveryData);
      console.log("Update response:", response);
      showSuccess("Delivery updated successfully");
    } else {
      // Create new delivery with double-checked data
      console.log("Creating new delivery with validated data:", deliveryData);

      // Ensure the sale_id is set explicitly
      if (!deliveryData.sale_id && props.sale?.id) {
        console.log("Explicitly setting sale_id from props:", props.sale.id);
        deliveryData.sale_id = props.sale.id;
      }

      response = await createDelivery(deliveryData);
      console.log("Create response:", response);
      showSuccess("Delivery created successfully");
    }

    // Emit the data from the response
    if (response && response.data) {
      emit("save", response.data);
    } else {
      // If we don't have response data, at least emit what we sent
      emit("save", deliveryData);
    }
  } catch (error) {
    console.error("Error saving delivery:", error);
    let errorMessage = "Failed to save delivery.";

    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);

      if (error.response.data.message) {
        errorMessage += " " + error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage += " " + error.response.data.error;
      } else if (error.response.status === 500) {
        errorMessage += " Server error. The sale may not exist or there may be data validation issues.";
      } else if (error.response.status === 404) {
        errorMessage += " Sale not found. Please try a different sale.";
      }
    } else if (error.message) {
      errorMessage += " " + error.message;
    }

    showApiError(errorMessage);
  } finally {
    loading.value = false;
  }
};

const isPickupOrOffline = computed(() => form.status === "pickup" || form.status === "offline");

onMounted(() => {
  // Log received sale data
  console.log("DeliveryForm mounted with sale data:", props.sale);

  // Log nested properties to debug
  if (props.sale) {
    console.log("Sale ID:", props.sale.id);
    console.log("Sale Product:", props.sale.Product);
    console.log("Sale Customer:", props.sale.Customer);
  }

  // Check if a delivery already exists for this sale
  if (props.sale?.id) {
    // Initialize form with sale ID
    form.saleId = props.sale.id;
    checkExistingDelivery();
  } else {
    console.error("No sale ID provided to DeliveryForm");
    showApiError("No sale ID provided. Cannot create delivery.");
  }
});
</script>
