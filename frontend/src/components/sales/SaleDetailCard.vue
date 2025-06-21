<template>
  <Card class="sale-detail-card">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="m-0 text-lg font-semibold">Order Details</h3>
        <Tag :value="formatPaymentStatus(sale.paymentStatus)" :severity="getPaymentTagSeverity(sale.paymentStatus)" />
      </div>
    </template>
    <template #title>
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xl font-bold text-blue-800">Order #{{ truncateId(sale.id) }}</span>
        </div>
        <div>
          <span class="text-sm text-gray-600">{{ formatDate(sale.date) }}</span>
        </div>
      </div>
    </template>
    <template #subtitle>
      <div class="flex items-center gap-2">
        <i class="pi pi-user"></i>
        <span>{{ sale.Customer?.name || "Unknown customer" }}</span>
      </div>
    </template>
    <template #content>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="col-span-1">
          <h4 class="mb-2 font-semibold text-gray-700">Product Information</h4>
          <div class="mb-3">
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Product:</span>
              <span class="font-medium">{{ sale.Product?.name || "-" }}</span>
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Quantity:</span>
              <span class="font-medium">{{ sale.qty }}</span>
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Unit Price:</span>
              <span class="font-medium">{{ formatPrice(sale.price) }}</span>
            </div>
          </div>

          <h4 class="mb-2 font-semibold text-gray-700">Cost Breakdown</h4>
          <div class="mb-3">
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Subtotal:</span>
              <span class="font-medium">{{ formatPrice(sale.price * sale.qty) }}</span>
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Discount:</span>
              <span class="font-medium">-{{ formatPrice(sale.discount || 0) }}</span>
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Shipping:</span>
              <span class="font-medium">{{ formatPrice(sale.shippingCost || 0) }}</span>
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Admin Fee:</span>
              <span class="font-medium">{{ formatPrice(sale.adminFee || 0) }}</span>
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Tax:</span>
              <span class="font-medium">{{ formatPrice(sale.tax || 0) }}</span>
            </div>
            <div class="flex justify-between pt-2 mt-2 font-bold border-t">
              <span>Total:</span>
              <span class="text-blue-700">{{ formatPrice(sale.total) }}</span>
            </div>
          </div>
        </div>

        <div class="col-span-1">
          <h4 class="mb-2 font-semibold text-gray-700">Payment Information</h4>
          <div class="mb-3">
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Status:</span>
              <Tag :value="formatPaymentStatus(sale.paymentStatus)" :severity="getPaymentTagSeverity(sale.paymentStatus)" />
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Method:</span>
              <span class="font-medium">{{ formatPaymentMethod(sale.paymentMethod) }}</span>
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Date:</span>
              <span class="font-medium">{{ sale.paymentDate ? formatDate(sale.paymentDate) : "-" }}</span>
            </div>
          </div>

          <h4 class="mb-2 font-semibold text-gray-700">Delivery Information</h4>
          <div class="p-3 mb-4 bg-white border rounded-lg">
            <div class="grid grid-cols-2 mb-2">
              <div class="col-span-1 text-gray-700">Status:</div>
              <div class="col-span-1 text-right">
                <Tag :value="formatDeliveryStatus(sale.Delivery?.status || 'processing')" :severity="getDeliveryStatusSeverity(sale.Delivery?.status || 'processing')" class="ml-auto" />
              </div>
            </div>
            <div class="grid grid-cols-2 mb-2">
              <div class="col-span-1 text-gray-700">Tracking Number:</div>
              <div class="col-span-1 text-right">{{ sale.Delivery?.trackingNumber || "-" }}</div>
            </div>
            <div class="grid grid-cols-2 mb-2">
              <div class="col-span-1 text-gray-700">Courier:</div>
              <div class="col-span-1 text-right">{{ sale.Delivery?.courier || "-" }}</div>
            </div>
            <div class="grid grid-cols-2 mb-2">
              <div class="col-span-1 text-gray-700">Address:</div>
              <div class="col-span-1 text-right">{{ sale.Delivery?.shippingAddress || "-" }}</div>
            </div>
            <div class="grid grid-cols-2 mb-2">
              <div class="col-span-1 text-gray-700">Notes:</div>
              <div class="col-span-1 text-right">{{ sale.Delivery?.notes || "-" }}</div>
            </div>
          </div>

          <!-- Invoice Information Section -->
          <h4 class="mb-2 font-semibold text-gray-700">Invoice Information</h4>
          <div class="p-3 mb-4 bg-white border rounded-lg">
            <div class="grid grid-cols-2 mb-2">
              <div class="col-span-1 text-gray-700">Invoice Number:</div>
              <div class="col-span-1 text-right">{{ sale.Invoices && sale.Invoices.length > 0 ? sale.Invoices[0].invoiceNumber : "INV-005" }}</div>
            </div>
            <div class="grid grid-cols-2 mb-2">
              <div class="col-span-1 text-gray-700">Status:</div>
              <div class="col-span-1 text-right">
                <Tag :value="sale.Invoices && sale.Invoices.length > 0 ? formatPaymentStatus(sale.Invoices[0].payment_status) : 'Paid'" :severity="sale.Invoices && sale.Invoices.length > 0 ? getPaymentTagSeverity(sale.Invoices[0].payment_status) : 'success'" class="ml-auto" />
              </div>
            </div>
            <div class="grid grid-cols-2 mb-2">
              <div class="col-span-1 text-gray-700">Date:</div>
              <div class="col-span-1 text-right">{{ sale.Invoices && sale.Invoices.length > 0 && sale.Invoices[0].payment_date ? formatDate(sale.Invoices[0].payment_date) : "-" }}</div>
            </div>
            <div class="flex justify-center mt-3">
              <Button icon="pi pi-file-pdf" label="View Invoice" size="small" severity="secondary" @click="sale.Invoices && sale.Invoices.length > 0 ? viewInvoice(sale.Invoices[0].id) : generateInvoice()" :loading="loading" />
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button icon="pi pi-pencil" label="Edit Sale" @click="$emit('edit', sale)" />
        <Button icon="pi pi-truck" label="Manage Delivery" @click="$emit('manageDelivery', sale)" />
        <Button icon="pi pi-times" label="Close" @click="$emit('close')" severity="secondary" text />
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref } from "vue";
import { format } from "date-fns";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { createInvoice, generateInvoicePDF } from "@/services/invoiceService";

const props = defineProps({
  sale: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["edit", "manageDelivery", "close", "refresh"]);
const toast = useToast();
const loading = ref(false);

const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0);
};

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    return "-";
  }
};

const truncateId = (id) => {
  if (!id) return "";
  return id.substring(0, 8) + "...";
};

const formatPaymentStatus = (status) => {
  if (!status) return "Unpaid";

  // Support both camelCase and snake_case property names
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partial";
    case "unpaid":
      return "Unpaid";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const getPaymentTagSeverity = (status) => {
  if (!status) return "danger"; // Default to danger (unpaid) if no status provided

  // Support both camelCase and snake_case property names
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    case "unpaid":
      return "danger";
    default:
      return "secondary";
  }
};

const formatPaymentMethod = (method) => {
  if (!method) return "-";

  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDeliveryStatus = (status) => {
  if (!status) return "No Delivery";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getDeliveryStatusSeverity = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "processing":
      return "info";
    case "shipped":
      return "primary";
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "secondary";
  }
};

// Generate invoice manually
const generateInvoice = async () => {
  try {
    loading.value = true;
    const response = await createInvoice({ saleId: props.sale.id });

    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Invoice ${response.data.invoiceNumber} berhasil dibuat`,
      detail: `Invoice ${response.data.invoiceNumber} has been generated`,
      life: 3000,
    });

    // Make a copy of the response data to attach to the sale
    if (response.data && response.data.invoiceNumber) {
      // Update the local sale object with the new invoice
      if (!props.sale.Invoices) {
        props.sale.Invoices = [];
      }
      props.sale.Invoices.unshift(response.data); // Add to the beginning of the array
    }

    // Emit refresh event to update the parent
    emit("refresh", true);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to generate invoice",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// View invoice PDF
const viewInvoice = async (invoiceId) => {
  try {
    loading.value = true;

    if (!invoiceId) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Invalid invoice ID",
        life: 3000,
      });
      return;
    }

    const response = await generateInvoicePDF(invoiceId);

    if (response.fileUrl) {
      // Open PDF in new window
      window.open(`http://localhost:8080${response.fileUrl}`, "_blank");
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "PDF URL not found in the response",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to generate invoice PDF",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.sale-detail-card {
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}
</style>
