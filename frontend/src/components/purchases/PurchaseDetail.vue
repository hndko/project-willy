<template>
  <div class="w-full p-6 bg-white rounded-lg shadow-md">
    <div class="flex flex-col pb-4 mb-6 border-b md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="mb-1 text-2xl font-bold text-blue-700">Purchase Details</h2>
        <p class="text-sm text-gray-500">ID: {{ purchase.id }}</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <Button icon="pi pi-pencil" label="Edit" @click="$emit('edit', purchase)" class="text-white bg-primary" />
        <Button icon="pi pi-times" label="Close" @click="$emit('close')" class="text-gray-700 bg-gray-200" outlined />
      </div>
    </div>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Raw Material</span>
          <span class="text-lg font-semibold">{{ purchase.RawMaterial?.name || "-" }}</span>
        </div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Supplier</span>
          <span class="text-lg font-semibold">{{ purchase.Supplier?.name || "-" }}</span>
        </div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Quantity</span>
          <span class="text-lg font-semibold">{{ purchase.qty }} {{ purchase.RawMaterial?.unit || "-" }}</span>
        </div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Price per Unit</span>
          <span class="text-lg font-semibold">{{ formatCurrency(purchase.price) }}</span>
        </div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Total</span>
          <span class="text-lg font-semibold">{{ formatCurrency(purchase.total) }}</span>
        </div>
      </div>
      <div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Status</span>
          <span class="inline-block px-3 py-1 text-white rounded-full" :class="statusClass(purchase.status)">{{ capitalize(purchase.status) }}</span>
        </div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Invoice Number</span>
          <span class="text-lg font-semibold">{{ purchase.invoiceNumber || purchase.invoice_number || "-" }}</span>
        </div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Purchase Date</span>
          <span class="text-lg font-semibold">{{ formatDate(purchase.date) }}</span>
        </div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Received Date</span>
          <span class="text-lg font-semibold">{{ formatDate(purchase.receivedDate || purchase.received_date) }}</span>
        </div>
        <div class="mb-4">
          <span class="block font-medium text-gray-600">Notes</span>
          <span class="text-gray-700">{{ purchase.notes || "-" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from "primevue/button";

const props = defineProps({
  purchase: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "edit"]);

// Format currency values (IDR)
const formatCurrency = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

// Format date values
const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");

const statusClass = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500";
    case "completed":
      return "bg-green-600";
    case "canceled":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
};
</script>
