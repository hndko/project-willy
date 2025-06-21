<template>
  <Dialog :visible="visible" :style="{ width: '500px' }" :header="editMode ? 'Edit Customer' : 'Add Customer'" :modal="true" class="p-fluid" @update:visible="$emit('update:visible', $event)">
    <div class="p-4">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label for="name" class="block mb-2 font-medium text-gray-700">Name <span class="text-red-500">*</span></label>
          <InputText id="name" v-model.trim="form.name" :class="{ 'p-invalid': v$.name.$invalid && submitted }" placeholder="Enter customer name" required />
          <small v-if="v$.name.$invalid && submitted" class="p-error">
            <span v-if="v$.name.required.$invalid">Name is required</span>
            <span v-else-if="v$.name.maxLength.$invalid">Name must be less than 100 characters</span>
          </small>
        </div>

        <div class="mb-4">
          <label for="email" class="block mb-2 font-medium text-gray-700">Email</label>
          <InputText id="email" v-model.trim="form.email" :class="{ 'p-invalid': v$.email.$invalid && submitted }" placeholder="Enter email address" />
          <small v-if="v$.email.$invalid && submitted" class="p-error">
            <span v-if="v$.email.email.$invalid">Please enter a valid email address</span>
          </small>
        </div>

        <div class="mb-4">
          <label for="phone" class="block mb-2 font-medium text-gray-700">Phone Number</label>
          <InputText id="phone" v-model.trim="form.phone" :class="{ 'p-invalid': v$.phone.$invalid && submitted }" placeholder="Enter phone number" />
          <small v-if="v$.phone.$invalid && submitted" class="p-error">
            <span v-if="v$.phone.phoneFormat.$invalid">Please enter a valid phone number</span>
          </small>
        </div>

        <div class="mb-4">
          <label for="address" class="block mb-2 font-medium text-gray-700">Address</label>
          <Textarea id="address" v-model.trim="form.address" rows="3" autoResize placeholder="Enter customer address" :class="{ 'p-invalid': v$.address.$invalid && submitted }" />
          <small v-if="v$.address.$invalid && submitted" class="p-error">
            <span v-if="v$.address.maxLength.$invalid">Address must be less than 255 characters</span>
          </small>
        </div>

        <div class="mb-4">
          <label for="description" class="block mb-2 font-medium text-gray-700">Description</label>
          <Textarea id="description" v-model.trim="form.description" rows="3" autoResize placeholder="Enter additional details about the customer" :class="{ 'p-invalid': v$.description.$invalid && submitted }" />
          <small v-if="v$.description.$invalid && submitted" class="p-error">
            <span v-if="v$.description.maxLength.$invalid">Description must be less than 500 characters</span>
          </small>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" icon="pi pi-times" @click="$emit('update:visible', false)" text />
        <Button :label="editMode ? 'Update' : 'Create'" icon="pi pi-check" @click="submitForm" :loading="loading" :disabled="submitted && !formIsValid" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { showSuccess, showApiError } from "@/utils/toast";
import { useVuelidate } from "@vuelidate/core";
import { required, email, maxLength, helpers } from "@vuelidate/validators";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import { createCustomer, updateCustomer } from "@/services/customerService";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  editData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:visible", "refresh"]);

const loading = ref(false);
const submitted = ref(false);
const editMode = computed(() => !!props.editData);

// Custom phone validator
const phoneRegex = /^(\+?[0-9]{1,4})?[-.\s]?(\([0-9]{1,4}\))?[-.\s]?[0-9]{1,10}$/;
const phoneFormat = helpers.withMessage("Please enter a valid phone number", helpers.regex(phoneRegex));

// Form data initialization
const form = reactive({
  name: "",
  email: "",
  phone: "",
  address: "",
  description: "",
});

// Enhanced validation rules
const rules = {
  name: {
    required,
    maxLength: maxLength(100),
  },
  email: {
    email,
  },
  phone: {
    phoneFormat,
  },
  address: {
    maxLength: maxLength(255),
  },
  description: {
    maxLength: maxLength(500),
  },
};

const v$ = useVuelidate(rules, form);

// Computed property to track form validity
const formIsValid = computed(() => {
  return !v$.value.$invalid && form.name.trim() !== "";
});

// Reset form to initial state
const resetForm = () => {
  form.name = "";
  form.email = "";
  form.phone = "";
  form.address = "";
  form.description = "";
  submitted.value = false;
  v$.value.$reset();
};

// Submit form
const submitForm = async () => {
  submitted.value = true;
  const isValid = await v$.value.$validate();

  if (!isValid) {
    showApiError("Please fill in all required fields correctly");
    return;
  }

  try {
    loading.value = true;
    const formData = {
      name: form.name.trim(),
      email: form.email ? form.email.trim() : null,
      phone: form.phone ? form.phone.trim() : null,
      address: form.address ? form.address.trim() : null,
      description: form.description ? form.description.trim() : null,
    };

    // Double check that required fields are not empty
    if (!formData.name) {
      showApiError("Customer name is required");
      loading.value = false;
      return;
    }

    if (editMode.value) {
      await updateCustomer(props.editData.id, formData);
      showSuccess("Pelanggan berhasil diubah");
    } else {
      await createCustomer(formData);
      showSuccess("Pelanggan berhasil ditambahkan");
    }

    resetForm();
    emit("update:visible", false);
    emit("refresh");
  } catch (error) {
    console.error("Error saving customer:", error);
    showApiError(error.response?.data?.message || "Gagal menyimpan pelanggan");
  } finally {
    loading.value = false;
  }
};

// Watch for changes in editData and update form
watch(
  () => props.editData,
  (newVal) => {
    if (newVal) {
      form.name = newVal.name || "";
      form.email = newVal.email || "";
      form.phone = newVal.phone || "";
      form.address = newVal.address || "";
      form.description = newVal.description || "";
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for visibility changes
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      resetForm();
    }
  }
);
</script>
