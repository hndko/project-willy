<template>
  <div class="p-fluid">
    <div class="mb-4" v-if="invoice">
      <h3 class="mb-2 text-lg font-medium">Invoice: {{ invoice.invoiceNumber }}</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-gray-500">Customer:</p>
          <p>{{ invoice.Customer ? invoice.Customer.name : "N/A" }}</p>
        </div>
        <div>
          <p class="text-gray-500">Date:</p>
          <p>{{ formatDate(invoice.date) }}</p>
        </div>
        <div>
          <p class="text-gray-500">Total:</p>
          <p class="font-semibold">{{ formatPrice(invoice.total) }}</p>
        </div>
        <div>
          <p class="text-gray-500">Current Status:</p>
          <p>
            <Tag :severity="getPaymentStatusSeverity(invoice.paymentStatus)" :value="formatPaymentStatus(invoice.paymentStatus)" />
          </p>
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="p-fluid">
      <div class="mb-4">
        <label for="paymentStatus" class="block mb-2 font-medium">Payment Status</label>
        <Dropdown
          id="paymentStatus"
          v-model="paymentData.paymentStatus"
          :options="paymentStatusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Payment Status"
          class="w-full"
          :class="{ 'p-invalid': v$ && v$.paymentStatus && v$.paymentStatus.$invalid && v$.paymentStatus.$dirty }"
        />
        <small v-if="v$ && v$.paymentStatus && v$.paymentStatus.$invalid && v$.paymentStatus.$dirty" class="p-error">{{ v$.paymentStatus.$errors[0]?.$message }}</small>
      </div>

      <div v-show="paymentData.paymentStatus === 'paid' || paymentData.paymentStatus === 'partial'" class="mb-4">
        <label for="paymentMethod" class="block mb-2 font-medium">Payment Method</label>
        <Dropdown
          id="paymentMethod"
          v-model="paymentData.paymentMethod"
          :options="paymentMethodOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Payment Method"
          class="w-full"
          :class="{ 'p-invalid': v$ && v$.paymentMethod && v$.paymentMethod.$invalid && v$.paymentMethod.$dirty }"
        />
        <small v-if="v$ && v$.paymentMethod && v$.paymentMethod.$invalid && v$.paymentMethod.$dirty" class="p-error">{{ v$.paymentMethod.$errors[0]?.$message }}</small>
      </div>

      <div v-show="paymentData.paymentStatus === 'paid' || paymentData.paymentStatus === 'partial'" class="mb-4">
        <label for="paymentDate" class="block mb-2 font-medium">Payment Date</label>
        <Calendar id="paymentDate" v-model="paymentData.paymentDate" dateFormat="dd/mm/yy" :showIcon="true" :maxDate="new Date()" placeholder="Select Payment Date" class="w-full" :class="{ 'p-invalid': v$ && v$.paymentDate && v$.paymentDate.$invalid && v$.paymentDate.$dirty }" />
        <small v-if="v$ && v$.paymentDate && v$.paymentDate.$invalid && v$.paymentDate.$dirty" class="p-error">{{ v$.paymentDate.$errors[0]?.$message }}</small>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <Button type="button" label="Cancel" icon="fi fi-rr-cross-small" class="p-button-outlined" @click="$emit('cancel')" />
        <Button type="submit" label="Update Payment" icon="fi fi-rr-check" :loading="loading" />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watchEffect } from "vue";
import { useToast } from "primevue/usetoast";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { format } from "date-fns";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import Tag from "primevue/tag";
import { updateInvoicePayment } from "@/services/invoiceService";
import { showSuccess, showApiError } from "@/utils/toast";

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const emit = defineEmits(["save", "cancel"]);
const loading = ref(false);

// Form data - safer initialization
const paymentData = reactive({
  paymentStatus: "unpaid",
  paymentMethod: "",
  paymentDate: null,
});

// Form validation rules
const rules = computed(() => {
  const baseRules = {
    paymentStatus: { required },
  };

  // Only validate payment method and date if status is paid or partial
  if (paymentData.paymentStatus === "paid" || paymentData.paymentStatus === "partial") {
    return {
      ...baseRules,
      paymentMethod: { required },
      paymentDate: { required },
    };
  }

  return baseRules;
});

// Initialize validation
const v$ = useVuelidate(rules, paymentData);

// Dropdown options
const paymentStatusOptions = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Partial Payment", value: "partial" },
  { label: "Paid", value: "paid" },
];

const paymentMethodOptions = [
  { label: "Cash", value: "Cash" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Credit Card", value: "Credit Card" },
  { label: "Debit Card", value: "Debit Card" },
  { label: "E-Wallet", value: "E-Wallet" },
  { label: "Check", value: "Check" },
];

// Format helpers
const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    return dateString;
  }
};

const formatPaymentStatus = (status) => {
  if (!status) return "Unpaid";
  const statusMap = {
    unpaid: "Unpaid",
    partial: "Partial",
    paid: "Paid",
  };
  return statusMap[status] || status;
};

const getPaymentStatusSeverity = (status) => {
  const severityMap = {
    unpaid: "danger",
    partial: "warning",
    paid: "success",
  };
  return severityMap[status] || "info";
};

// Form submission
const handleSubmit = async () => {
  if (!v$.value) return;

  const isValid = await v$.value.$validate();
  if (!isValid) return;

  loading.value = true;

  try {
    // If the status is unpaid, clear the payment method and date
    const dataToSubmit = { ...paymentData };
    if (dataToSubmit.paymentStatus === "unpaid") {
      dataToSubmit.paymentMethod = null;
      dataToSubmit.paymentDate = null;
    }

    if (props.invoice && props.invoice.id) {
      await updateInvoicePayment(props.invoice.id, dataToSubmit);
      showSuccess("Pembayaran invoice berhasil diubah");
      emit("save");
    } else {
      throw new Error("Invalid invoice ID");
    }
  } catch (error) {
    showApiError(error);
  } finally {
    loading.value = false;
  }
};

// Initialize form with invoice data when component mounts
onMounted(() => {
  if (props.invoice) {
    paymentData.paymentStatus = props.invoice.paymentStatus || "unpaid";
    paymentData.paymentMethod = props.invoice.paymentMethod || "";
    paymentData.paymentDate = props.invoice.paymentDate ? new Date(props.invoice.paymentDate) : null;
  }
});
</script>

<style scoped>
/* Optional additional styling */
.p-dropdown-label {
  display: flex;
  align-items: center;
}
</style>
