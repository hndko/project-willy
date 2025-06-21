<template>
  <DashboardLayout pageTitle="Sales Management">
    <div class="grid grid-cols-1 gap-4">
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold">Sales Orders</span>
              <Tag v-if="tabMenuActiveIndex === 0" severity="info" value="All Orders" />
              <Tag v-else-if="tabMenuActiveIndex === 1" severity="warning" value="Pending Payment" />
              <Tag v-else-if="tabMenuActiveIndex === 2" severity="warning" value="Pending Processing" />
              <Tag v-else-if="tabMenuActiveIndex === 3" severity="warning" value="Pending Fulfillment" />
              <Tag v-else-if="tabMenuActiveIndex === 4" severity="info" value="In Shipping" />
              <Tag v-else-if="tabMenuActiveIndex === 5" severity="success" value="Completed" />
            </div>
            <div>
              <Button label="New Sale" icon="pi pi-plus" @click="openSaleForm" severity="primary" />
            </div>
          </div>
        </template>
        <template #content>
          <!-- Custom Tab Navigation -->
          <div class="mb-4 custom-tabs">
            <div class="tab-container">
              <div v-for="(item, index) in tabMenuItems" :key="index" class="tab-item" :class="{ active: tabMenuActiveIndex === index }" @click="handleTabChange(index)">
                <i :class="['tab-icon', item.icon]"></i>
                <span class="tab-label">{{ item.label }}</span>
              </div>
            </div>
          </div>

          <SalesTable ref="salesTable" :refresh="refreshTable" :statusFilter="getCurrentStatusFilter()" @edit="editSale" @refresh="handleTableRefresh" @manageDelivery="openDeliveryModal" @view="viewSaleDetail" />
        </template>
      </Card>
    </div>

    <!-- Sale Form Dialog -->
    <Dialog v-model:visible="formDialogVisible" :header="isEditMode ? 'Edit Sale' : 'Create Sale'" :style="{ width: '600px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <SalesForm :sale="selectedSale" :isEdit="isEditMode" @save="handleSaleSaved" @cancel="closeForm" @openDelivery="handleOpenDeliveryAfterSale" />
    </Dialog>

    <!-- Delivery Modal -->
    <Dialog v-model:visible="deliveryModalVisible" :header="selectedSale.id ? 'Manage Delivery' : 'New Delivery'" :style="{ width: '600px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <SaleDeliveryModal :sale="selectedSale" @save="handleDeliverySaved" @cancel="closeDeliveryModal" />
    </Dialog>

    <!-- Sale Detail Dialog -->
    <Dialog v-model:visible="detailDialogVisible" header="Sale Details" :style="{ width: '900px' }" :modal="true" :closable="true" :closeOnEscape="true">
      <SaleDetailCard v-if="selectedSale.id" :sale="selectedSale" @edit="editFromDetail" @manageDelivery="manageDeliveryFromDetail" @close="closeDetailDialog" @refresh="handleTableRefresh" />
    </Dialog>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Dialog from "primevue/dialog";
// import TabMenu from "primevue/tabmenu"; // We're using custom tabs instead
import SalesTable from "@/components/sales/SalesTable.vue";
import SalesForm from "@/components/sales/SalesForm.vue";
import SaleDeliveryModal from "@/components/sales/SaleDeliveryModal.vue";
import SaleDetailCard from "@/components/sales/SaleDetailCard.vue";
import { showSuccess, showApiError } from "@/utils/toast";

const route = useRoute();

// Tab menu setup
const tabMenuActiveIndex = ref(0);
const tabMenuItems = ref([
  { label: "All Orders", icon: "pi pi-list" },
  { label: "Pending Payment", icon: "pi pi-wallet" },
  { label: "Pending Processing", icon: "pi pi-sync" },
  { label: "Pending Fulfillment", icon: "pi pi-box" },
  { label: "In Shipping", icon: "pi pi-truck" },
  { label: "Completed", icon: "pi pi-check-circle" },
]);

// Form handling
const formDialogVisible = ref(false);
const isEditMode = ref(false);
const selectedSale = ref({});
const refreshTable = ref(false);

// Sale detail dialog
const detailDialogVisible = ref(false);

// Check URL query parameters on mount
onMounted(() => {
  // If the URL has action=new, open the new sale form
  if (route.query.action === "new") {
    openSaleForm();
  }
});

// Watch for route query changes
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.action === "new") {
      openSaleForm();
    }
  },
  { deep: true }
);

// Open form for creating a new sale
const openSaleForm = () => {
  isEditMode.value = false;
  selectedSale.value = {};
  formDialogVisible.value = true;
};

// Open form for editing an existing sale
const editSale = (sale) => {
  isEditMode.value = true;
  selectedSale.value = sale;
  formDialogVisible.value = true;
};

// Close the form dialog
const closeForm = () => {
  formDialogVisible.value = false;
};

// Handle save from form
const handleSaleSaved = () => {
  console.log("Sale saved, triggering table refresh");
  closeForm();
  // Set to false first to ensure the watcher detects the change
  refreshTable.value = false;
  // Use setTimeout to ensure the value change is detected
  setTimeout(() => {
    console.log("Setting refreshTable to true");
    refreshTable.value = true;
  }, 100);
};

// Reset refresh trigger after table has refreshed
const handleTableRefresh = (shouldRefresh = false) => {
  console.log("Table refresh event received, shouldRefresh:", shouldRefresh);

  if (shouldRefresh) {
    console.log("Triggering table refresh from delete operation");
    // Set to false first to ensure the watcher detects the change
    refreshTable.value = false;
    // Use setTimeout to ensure the value change is detected
    setTimeout(() => {
      console.log("Setting refreshTable to true for refresh cycle");
      refreshTable.value = true;
    }, 100);
  } else {
    console.log("Resetting refreshTable flag");
    refreshTable.value = false;
  }
};

// Get current status filter based on the selected tab
const getCurrentStatusFilter = () => {
  switch (tabMenuActiveIndex.value) {
    case 0:
      return ""; // All Orders - no filter
    case 1:
      return "unpaid"; // Pending Payment - filter by payment status
    case 2:
      return "processing"; // Pending Processing - filter by processing status
    case 3:
      return "pendingFulfillment"; // Pending Fulfillment - orders with no delivery
    case 4:
      return "inShipping"; // In Shipping - filter by shipping status
    case 5:
      return "completed"; // Completed - filter by completion status
    default:
      return "";
  }
};

// Delivery modal handling
const deliveryModalVisible = ref(false);

// Open delivery modal with proper error handling
const openDeliveryModal = (sale) => {
  try {
    if (!sale || !sale.id) {
      showApiError("Error", "Cannot manage delivery: Invalid sale data");
      return;
    }

    console.log("Opening delivery modal for sale:", sale.id);
    selectedSale.value = { ...sale }; // Create a copy to avoid reference issues
    deliveryModalVisible.value = true;
  } catch (error) {
    handleError(error, "Failed to open delivery management");
  }
};

// Close delivery modal
const closeDeliveryModal = () => {
  deliveryModalVisible.value = false;
};

// Handle delivery saved with improved error handling
const handleDeliverySaved = (deliveryData) => {
  try {
    console.log("Delivery saved data received:", deliveryData);

    if (!deliveryData) {
      console.error("No delivery data received");
      return;
    }

    // Optimistically update the selected sale
    if (selectedSale.value) {
      console.log("Updating sale with delivery data:", selectedSale.value.id);
      // If delivery was just created
      if (!selectedSale.value.Delivery) {
        selectedSale.value.Delivery = deliveryData;
      } else {
        // Update existing delivery
        Object.assign(selectedSale.value.Delivery, deliveryData);
      }
    }

    closeDeliveryModal();

    // Refresh the sales table
    console.log("Refreshing sales table after delivery save");
    refreshTable.value = false;
    setTimeout(() => {
      refreshTable.value = true;
    }, 100);

    showSuccess("Delivery information saved successfully");
  } catch (error) {
    handleError(error, "Failed to save delivery information");
  }
};

// Handle opening delivery form after sale is created with validation
const handleOpenDeliveryAfterSale = (sale) => {
  try {
    if (!sale || !sale.id) {
      showApiError("Error", "Cannot manage delivery: Invalid sale data from new sale");
      return;
    }

    closeForm();
    console.log("Opening delivery after sale creation:", sale.id);
    selectedSale.value = { ...sale }; // Create a copy to avoid reference issues
    openDeliveryModal(selectedSale.value);
  } catch (error) {
    handleError(error, "Failed to open delivery form after sale creation");
  }
};

// View sale detail
const viewSaleDetail = (sale) => {
  selectedSale.value = sale;
  detailDialogVisible.value = true;
};

// Close detail dialog
const closeDetailDialog = () => {
  detailDialogVisible.value = false;
};

// Edit from detail view
const editFromDetail = (sale) => {
  closeDetailDialog();
  editSale(sale);
};

// Manage delivery from detail view
const manageDeliveryFromDetail = (sale) => {
  closeDetailDialog();
  openDeliveryModal(sale);
};

// Handle tab change
const handleTabChange = (index) => {
  tabMenuActiveIndex.value = index;

  // Set loading state for better UX
  if (salesTable.value) {
    salesTable.value.loading = true;
  }

  // Reset and trigger table refresh when changing tabs
  refreshTable.value = false;
  setTimeout(() => {
    refreshTable.value = true;
  }, 100);
};

// Reference to sales table component
const salesTable = ref(null);

// Improved error handler with better context information
const handleError = (error, message = "An error occurred") => {
  console.error("Error in Sales component:", error);
  let errorDetail = message;

  if (error.response) {
    console.error("Error response:", error.response.status, error.response.data);
    if (error.response.data?.message) {
      errorDetail += ": " + error.response.data.message;
    } else if (error.response.status === 404) {
      errorDetail += ": Resource not found";
    } else if (error.response.status === 500) {
      errorDetail += ": Server error. Please try again later.";
    }
  } else if (error.message) {
    errorDetail += ": " + error.message;
  }

  showApiError("Error", errorDetail);
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
