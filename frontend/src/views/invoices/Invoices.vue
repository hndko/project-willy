<template>
  <DashboardLayout pageTitle="Invoice Management">
    <div class="grid grid-cols-1 gap-4">
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold">Invoices</span>
              <Tag v-if="tabMenuActiveIndex === 0" severity="info" value="All Invoices" />
              <Tag v-else-if="tabMenuActiveIndex === 1" severity="danger" value="Unpaid" />
              <Tag v-else-if="tabMenuActiveIndex === 2" severity="warning" value="Partial Payment" />
              <Tag v-else-if="tabMenuActiveIndex === 3" severity="success" value="Paid" />
            </div>
          </div>
        </template>
        <template #content>
          <!-- Custom Tab Navigation -->
          <div class="mb-4 custom-tabs">
            <div class="tab-container">
              <div v-for="(item, index) in tabMenuItems" :key="index" class="tab-item" :class="{ active: tabMenuActiveIndex === index }" @click="tabMenuActiveIndex = index">
                <i :class="['tab-icon', item.icon]"></i>
                <span class="tab-label">{{ item.label }}</span>
              </div>
            </div>
          </div>

          <InvoicesTable :paymentFilter="getCurrentPaymentFilter()" :refresh="refreshTable" @edit="viewInvoiceDetail" @refresh="handleTableRefresh" />
        </template>
      </Card>
    </div>

    <!-- Invoice Payment Dialog -->
    <Dialog v-model:visible="paymentDialogVisible" header="Update Payment Status" :style="{ width: '500px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <InvoicePaymentForm :invoice="selectedInvoice" @save="handlePaymentSaved" @cancel="closePaymentDialog" />
    </Dialog>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Dialog from "primevue/dialog";
import InvoicesTable from "@/components/invoices/InvoicesTable.vue";
import InvoicePaymentForm from "@/components/invoices/InvoicePaymentForm.vue";
import { showSuccess, showApiError } from "@/utils/toast";

const router = useRouter();

// Tab menu setup
const tabMenuActiveIndex = ref(0);
const tabMenuItems = ref([
  { label: "All Invoices", icon: "fi fi-rr-list" },
  { label: "Unpaid", icon: "fi fi-rr-circle-xmark" },
  { label: "Partial Payment", icon: "fi fi-rr-hourglass-end" },
  { label: "Paid", icon: "fi fi-rr-check-circle" },
]);

// Get the current payment filter based on the active tab
const getCurrentPaymentFilter = () => {
  switch (tabMenuActiveIndex.value) {
    case 1:
      return "unpaid";
    case 2:
      return "partial";
    case 3:
      return "paid";
    default:
      return "";
  }
};

// Dialog and form handling
const paymentDialogVisible = ref(false);
const selectedInvoice = ref({});
const refreshTable = ref(false);

// View invoice details
const viewInvoiceDetail = (invoice) => {
  router.push(`/invoices/${invoice.id}`);
};

// Open payment dialog
const openPaymentDialog = (invoice) => {
  selectedInvoice.value = invoice;
  paymentDialogVisible.value = true;
};

// Close payment dialog
const closePaymentDialog = () => {
  paymentDialogVisible.value = false;
};

// Handle payment saved
const handlePaymentSaved = () => {
  closePaymentDialog();
  // Set to false first to ensure the watcher detects the change
  refreshTable.value = false;
  // Use setTimeout to ensure the value change is detected
  setTimeout(() => {
    refreshTable.value = true;
  }, 100);
};

// Reset refresh trigger after table has refreshed
const handleTableRefresh = (shouldRefresh = false) => {
  console.log("handleTableRefresh called with shouldRefresh:", shouldRefresh);
  if (shouldRefresh) {
    // Set to false first to ensure the watcher detects the change
    refreshTable.value = false;
    // Use setTimeout to ensure the value change is detected
    setTimeout(() => {
      console.log("Setting refreshTable to true to trigger reload");
      refreshTable.value = true;
    }, 100);
  } else {
    console.log("Resetting refreshTable flag to false");
    refreshTable.value = false;
  }
};
</script>

<style scoped>
.custom-tabs {
  width: 100%;
  padding: 0;
  margin: 0;
}

.tab-container {
  display: flex;
  width: 100%;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 1rem;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  position: relative;
}

.tab-item:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.tab-item.active {
  border-bottom-color: #3b82f6;
  color: #3b82f6;
}

.tab-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.tab-label {
  white-space: nowrap;
}

/* Responsive styling */
@media (max-width: 768px) {
  .tab-container {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tab-item {
    flex: 0 0 auto;
    padding: 1rem;
  }
}
</style>
