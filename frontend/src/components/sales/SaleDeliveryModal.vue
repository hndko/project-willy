<template>
  <div class="delivery-modal">
    <div v-if="loading" class="flex justify-center p-6">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="5" />
    </div>
    <DeliveryForm v-else :sale="saleWithDetails" :isEdit="!!existingDelivery" @save="handleSave" @cancel="$emit('cancel')" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import DeliveryForm from "@/components/deliveries/DeliveryForm.vue";
import ProgressSpinner from "primevue/progressspinner";
import { getDeliveryBySaleId } from "@/services/deliveryService";
import { getSaleById } from "@/services/saleService";

const props = defineProps({
  sale: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["save", "cancel"]);
const toast = useToast();
const loading = ref(true);
const existingDelivery = ref(null);
const saleDetails = ref(null);

// Computed property to merge the original sale data with the fetched details
const saleWithDetails = computed(() => {
  if (saleDetails.value) {
    return saleDetails.value;
  }
  return props.sale;
});

// Fetch detailed sale information
const fetchSaleDetails = async () => {
  if (!props.sale?.id) {
    console.error("Missing sale ID in props");
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Data penjualan tidak ditemukan - tidak dapat mengambil detail",
      life: 5000,
    });
    loading.value = false;
    return;
  }

  try {
    console.log("Fetching sale details for ID:", props.sale.id);
    const response = await getSaleById(props.sale.id);

    if (!response.data) {
      throw new Error("Sale data not returned from API");
    }

    saleDetails.value = response.data;
    console.log("Fetched detailed sale data:", saleDetails.value);

    // Ensure sale_id is properly set for the delivery
    if (saleDetails.value && !form.value) {
      form.value = { sale_id: saleDetails.value.id };
      console.log("Set form.value.sale_id to:", form.value.sale_id);
    }
  } catch (error) {
    console.error("Error fetching sale details:", error);
    console.error("Error response data:", error.response?.data);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal memuat detail penjualan: " + (error.response?.data?.message || error.message),
      life: 5000,
    });
    loading.value = false;
  }
};

// Check if delivery already exists for this sale
const checkExistingDelivery = async () => {
  if (!props.sale?.id) {
    console.error("No sale ID provided to check for delivery");
    loading.value = false;
    return;
  }

  try {
    console.log("Checking delivery for sale ID:", props.sale.id);
    const response = await getDeliveryBySaleId(props.sale.id);

    // Check if we got a "not found" response
    if (response.status === "NotFound" || !response.data) {
      console.log("No existing delivery found for this sale (expected)");
      existingDelivery.value = null;
    } else {
      // We have an existing delivery
      existingDelivery.value = response.data;
      console.log("Existing delivery found:", existingDelivery.value);
    }
  } catch (error) {
    // Only show error toast for real errors, not for "delivery not found" case
    console.error("Error checking for existing delivery:", error);
    console.error("Response:", error.response?.data || "No response data");
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Failed to check existing delivery: ${error.response?.data?.message || error.message}`,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Create a form value ref to pass sale_id when needed
const form = ref(null);

// Handle component save with proper error handling
const handleSave = (deliveryData) => {
  try {
    // Ensure delivery data has a sale_id
    if (deliveryData && !deliveryData.sale_id && saleWithDetails.value?.id) {
      console.log("Adding missing sale_id to delivery data:", saleWithDetails.value.id);
      deliveryData.sale_id = saleWithDetails.value.id;
    }

    console.log("DeliveryModal: Saving delivery data:", deliveryData);
    emit("save", deliveryData);
  } catch (error) {
    console.error("Error in handleSave:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to process delivery data",
      life: 3000,
    });
  }
};

onMounted(async () => {
  console.log("SaleDeliveryModal mounted with sale:", props.sale);

  if (!props.sale?.id) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Missing sale information",
      life: 3000,
    });
    loading.value = false;
    return;
  }

  try {
    // First fetch the sale details to ensure we have complete data
    await fetchSaleDetails();

    // Then check for existing delivery
    await checkExistingDelivery();
  } catch (error) {
    console.error("Error during SaleDeliveryModal initialization:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to initialize delivery form: " + (error.message || "Unknown error"),
      life: 5000,
    });
    loading.value = false;
  }
});
</script>

<style scoped>
.delivery-modal {
  min-height: 200px;
}
</style>
