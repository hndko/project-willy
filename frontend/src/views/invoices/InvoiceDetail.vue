<template>
  <DashboardLayout pageTitle="Invoice Detail">
    <div class="grid grid-cols-1 gap-4">
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold">Invoice Details</span>
              <Tag v-if="invoice.paymentStatus === 'paid'" severity="success" value="Paid" />
              <Tag v-else-if="invoice.paymentStatus === 'partial'" severity="warning" value="Partial Payment" />
              <Tag v-else severity="danger" value="Unpaid" />
            </div>
            <div class="flex gap-2">
              <Button icon="fi fi-rr-arrow-left" label="Back" @click="goBack" outlined />
              <Button icon="fi fi-rr-wallet" label="Update Payment" @click="openPaymentDialog" severity="warning" outlined />
              <Button icon="fi fi-rr-document-signed" label="Generate PDF" @click="generatePDF" severity="primary" />
            </div>
          </div>
        </template>
        <template #content>
          <div v-if="loading" class="flex justify-center py-8">
            <ProgressSpinner />
          </div>
          <div v-else-if="!invoice.id" class="py-8 text-center text-gray-500">Invoice not found.</div>
          <div v-else>
            <!-- Invoice Header -->
            <div class="pb-4 mb-4 border-b">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <h3 class="mb-2 font-medium">Invoice Information</h3>
                  <p class="mb-1 text-sm"><span class="mr-2 font-medium">Invoice Number:</span> {{ invoice.invoiceNumber }}</p>
                  <p class="mb-1 text-sm"><span class="mr-2 font-medium">Date:</span> {{ formatDate(invoice.date) }}</p>
                  <p v-if="invoice.Sale" class="mb-1 text-sm"><span class="mr-2 font-medium">Sale ID:</span> {{ truncateId(invoice.Sale.id) }}</p>
                </div>
                <div>
                  <h3 class="mb-2 font-medium">Customer Information</h3>
                  <p v-if="invoice.Customer" class="mb-1 text-sm"><span class="mr-2 font-medium">Customer:</span> {{ invoice.Customer.name }}</p>
                  <p v-else class="mb-1 text-sm text-gray-500">No customer information</p>
                </div>
                <div>
                  <h3 class="mb-2 font-medium">Payment Information</h3>
                  <p class="mb-1 text-sm">
                    <span class="mr-2 font-medium">Status:</span>
                    <Tag :severity="getPaymentStatusSeverity(invoice.paymentStatus)" :value="formatPaymentStatus(invoice.paymentStatus)" />
                  </p>
                  <p v-if="invoice.paymentMethod" class="mb-1 text-sm"><span class="mr-2 font-medium">Method:</span> {{ invoice.paymentMethod }}</p>
                  <p v-if="invoice.paymentDate" class="mb-1 text-sm"><span class="mr-2 font-medium">Payment Date:</span> {{ formatDate(invoice.paymentDate) }}</p>
                </div>
              </div>
            </div>

            <!-- Invoice Items -->
            <h3 class="mb-4 font-medium">Invoice Items</h3>
            <DataTable :value="invoice.InvoiceItems" stripedRows class="mb-4">
              <Column field="nameSnapshot" header="Product"></Column>
              <Column field="priceSnapshot" header="Price">
                <template #body="slotProps">
                  {{ formatPrice(slotProps.data.priceSnapshot) }}
                </template>
              </Column>
              <Column field="qty" header="Quantity"></Column>
              <Column field="subtotal" header="Subtotal">
                <template #body="slotProps">
                  {{ formatPrice(slotProps.data.priceSnapshot * slotProps.data.qty) }}
                </template>
              </Column>
            </DataTable>

            <!-- Invoice Summary -->
            <div class="flex justify-end pt-4 border-t">
              <div class="w-full md:w-1/3">
                <div class="flex justify-between py-2">
                  <span class="font-medium">Subtotal:</span>
                  <span>{{ formatPrice(calculateSubtotal()) }}</span>
                </div>
                <div v-if="getShippingCost()" class="flex justify-between py-2">
                  <span class="font-medium">Shipping Cost:</span>
                  <span>{{ formatPrice(getShippingCost()) }}</span>
                </div>
                <div v-if="invoice.discount" class="flex justify-between py-2">
                  <span class="font-medium">Discount:</span>
                  <span class="text-green-600">-{{ formatPrice(invoice.discount) }}</span>
                </div>
                <div v-if="getAdminFee()" class="flex justify-between py-2">
                  <span class="font-medium">Admin Fee:</span>
                  <span>{{ formatPrice(getAdminFee()) }}</span>
                </div>
                <div v-if="invoice.tax" class="flex justify-between py-2">
                  <span class="font-medium">Tax:</span>
                  <span>{{ formatPrice(invoice.tax) }}</span>
                </div>
                <div class="flex justify-between py-2 text-lg font-bold border-t border-gray-200">
                  <span>Total:</span>
                  <span>{{ formatPrice(calculateTotal()) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Payment Dialog -->
    <Dialog v-model:visible="paymentDialogVisible" header="Update Payment Status" :style="{ width: '500px' }" :modal="true">
      <InvoicePaymentForm :invoice="invoice" @save="handlePaymentSaved" @cancel="closePaymentDialog" />
    </Dialog>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";
import { showSuccess, showApiError } from "@/utils/toast";
import { format } from "date-fns";
import { getInvoiceById, generateInvoicePDF } from "@/services/invoiceService";
import InvoicePaymentForm from "@/components/invoices/InvoicePaymentForm.vue";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const invoice = ref({});
const paymentDialogVisible = ref(false);

const loadInvoiceData = async () => {
  loading.value = true;
  try {
    const invoiceId = route.params.id;
    const response = await getInvoiceById(invoiceId);
    if (response && response.data) {
      invoice.value = response.data;
    } else {
      showApiError("Error", "Invoice not found or data structure incorrect");
    }
  } catch (error) {
    console.error("Error loading invoice:", error);
    showApiError("Error", "Failed to load invoice details");
  } finally {
    loading.value = false;
  }
};

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

const truncateId = (id) => {
  if (!id) return "";
  return id.substring(0, 8) + "...";
};

const getShippingCost = () => {
  if (invoice.value && invoice.value.Sale && invoice.value.Sale.shippingCost) {
    return invoice.value.Sale.shippingCost;
  }
  return 0;
};

const getAdminFee = () => {
  if (invoice.value && invoice.value.Sale && invoice.value.Sale.adminFee) {
    return invoice.value.Sale.adminFee;
  }
  return 0;
};

const calculateSubtotal = () => {
  if (!invoice.value || !invoice.value.InvoiceItems) return 0;
  return invoice.value.InvoiceItems.reduce((sum, item) => sum + item.priceSnapshot * item.qty, 0);
};

const calculateTotal = () => {
  if (!invoice.value) return 0;

  let total = calculateSubtotal();
  if (invoice.value.discount) total -= invoice.value.discount;
  if (invoice.value.tax) total += invoice.value.tax;

  // Add shipping cost and admin fee from Sale
  total += getShippingCost();
  total += getAdminFee();

  return total;
};

// Action handlers
const goBack = () => {
  router.push("/invoices");
};

const openPaymentDialog = () => {
  paymentDialogVisible.value = true;
};

const closePaymentDialog = () => {
  paymentDialogVisible.value = false;
};

const handlePaymentSaved = () => {
  closePaymentDialog();
  // Reload invoice data to get updated payment info
  loadInvoiceData();
};

const generatePDF = async () => {
  try {
    loading.value = true;
    const response = await generateInvoicePDF(invoice.value.id);

    if (response.fileUrl) {
      // Open PDF in new window
      window.open(`http://localhost:8080${response.fileUrl}`, "_blank");

      showSuccess("Success", "Invoice PDF generated successfully");
    }
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    showApiError("Error", "Failed to generate invoice PDF");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadInvoiceData();
});
</script>
