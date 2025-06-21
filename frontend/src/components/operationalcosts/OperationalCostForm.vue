<template>
  <Dialog :visible="visible" :style="{ width: '550px' }" :header="editData ? 'Edit Operational Cost' : 'Add New Operational Cost'" :modal="true" class="p-fluid" :closable="!isSubmitting" :closeOnEscape="!isSubmitting" @update:visible="$emit('update:visible', $event)">
    <div class="p-4">
      <div class="mb-4">
        <label for="title" class="block mb-1 font-medium">Title *</label>
        <InputText id="title" v-model.trim="form.title" :class="{ 'p-invalid': v$.title.$invalid && v$.title.$dirty }" placeholder="Enter cost title" @blur="v$.title.$touch()" />
        <small v-if="v$.title.$invalid && v$.title.$dirty" class="p-error">{{ v$.title.$errors[0].$message }}</small>
      </div>

      <div class="mb-4">
        <label for="description" class="block mb-1 font-medium">Description *</label>
        <InputText id="description" v-model.trim="form.description" :class="{ 'p-invalid': v$.description.$invalid && v$.description.$dirty }" placeholder="Enter cost description" @blur="v$.description.$touch()" />
        <small v-if="v$.description.$invalid && v$.description.$dirty" class="p-error">{{ v$.description.$errors[0].$message }}</small>
      </div>

      <div class="mb-4">
        <label for="amount" class="block mb-1 font-medium">Amount (IDR) *</label>
        <InputNumber id="amount" v-model="form.amount" :class="{ 'p-invalid': v$.amount.$invalid && v$.amount.$dirty }" placeholder="Enter amount" mode="currency" currency="IDR" locale="id-ID" @blur="v$.amount.$touch()" :minFractionDigits="0" />
        <small v-if="v$.amount.$invalid && v$.amount.$dirty" class="p-error">{{ v$.amount.$errors[0].$message }}</small>
      </div>

      <div class="mb-4">
        <label for="date" class="block mb-1 font-medium">Date *</label>
        <Calendar id="date" v-model="form.date" :class="{ 'p-invalid': v$.date.$invalid && v$.date.$dirty }" placeholder="Select date" dateFormat="dd/mm/yy" showIcon @blur="v$.date.$touch()" />
        <small v-if="v$.date.$invalid && v$.date.$dirty" class="p-error">{{ v$.date.$errors[0].$message }}</small>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" outlined @click="$emit('update:visible', false)" :disabled="isSubmitting" />
      <Button label="Save" icon="pi pi-check" @click="handleSubmit" :loading="isSubmitting" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useVuelidate } from "@vuelidate/core";
import { required, minValue } from "@vuelidate/validators";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Calendar from "primevue/calendar";
import Button from "primevue/button";
import { createOperationalCost, updateOperationalCost } from "@/services/operationalCostService";
import { useAuthStore } from "@/stores/auth/indexAuth";
import { showSuccess, showApiError } from "@/utils/toast";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  editData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:visible", "refresh"]);

const isSubmitting = ref(false);
const authStore = useAuthStore();

const form = reactive({
  title: "",
  description: "",
  amount: null,
  date: null,
});

// Form validation rules
const rules = computed(() => {
  return {
    title: { required },
    description: { required },
    amount: {
      required,
      minValue: minValue(1),
    },
    date: { required },
  };
});

const v$ = useVuelidate(rules, form);

// Reset form to defaults - Define this function before it's used in watch
const resetForm = () => {
  form.title = "";
  form.description = "";
  form.amount = null;
  form.date = null;
  v$.value.$reset();
};

// Watch for changes in editData and populate form
watch(
  () => props.editData,
  (newVal) => {
    if (newVal) {
      form.title = newVal.title;
      form.description = newVal.description;
      form.amount = newVal.amount;
      form.date = new Date(newVal.date);
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

onMounted(() => {
  // User ID will be extracted from token on the backend using auth middleware
  // The userId is automatically associated with the logged-in user via the auth middleware
});

const handleSubmit = async () => {
  v$.value.$touch();

  if (v$.value.$invalid) {
    showApiError("Please fill in all required fields correctly");
    return;
  }

  try {
    isSubmitting.value = true;

    // Prepare data for submission with userId
    const submissionData = {
      title: form.title,
      description: form.description,
      amount: form.amount,
      date: form.date,
      userId: authStore.user.id,
    };

    if (props.editData) {
      await updateOperationalCost(props.editData.id, submissionData);
      showSuccess("Biaya operasional berhasil diubah");
    } else {
      await createOperationalCost(submissionData);
      showSuccess("Biaya operasional berhasil ditambahkan");
    }

    // Close form and trigger refresh in one clean sequence
    emit("update:visible", false);
    emit("refresh");
    resetForm();
  } catch (error) {
    console.error("Error saving operational cost:", error);
    showApiError(error.response?.data?.message || "Gagal menyimpan biaya operasional");
  } finally {
    isSubmitting.value = false;
  }
};
</script>
