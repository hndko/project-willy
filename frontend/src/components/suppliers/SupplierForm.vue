<template>
  <Dialog :visible="visible" :style="{ width: '500px' }" :header="editMode ? 'Edit Supplier' : 'Add Supplier'" :modal="true" class="p-fluid" @update:visible="$emit('update:visible', $event)">
    <div class="p-4">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label for="name" class="block mb-2 font-medium text-gray-700">Name</label>
          <InputText id="name" v-model="form.name" :class="{ 'p-invalid': v$.name.$invalid && submitted }" placeholder="Enter supplier name" required />
          <small v-if="v$.name.$invalid && submitted" class="p-error">{{ v$.name.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="phone" class="block mb-2 font-medium text-gray-700">Phone Number</label>
          <InputText id="phone" v-model="form.phone" :class="{ 'p-invalid': v$.phone.$invalid && submitted }" placeholder="Enter phone number" required />
          <small v-if="v$.phone.$invalid && submitted" class="p-error">{{ v$.phone.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="email" class="block mb-2 font-medium text-gray-700">Email</label>
          <InputText id="email" v-model="form.email" :class="{ 'p-invalid': v$.email.$invalid && submitted }" placeholder="Enter email address" required />
          <small v-if="v$.email.$invalid && submitted" class="p-error">{{ v$.email.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="address" class="block mb-2 font-medium text-gray-700">Address</label>
          <Textarea id="address" v-model="form.address" rows="3" autoResize :class="{ 'p-invalid': v$.address.$invalid && submitted }" placeholder="Enter supplier address" required />
          <small v-if="v$.address.$invalid && submitted" class="p-error">{{ v$.address.$errors[0].$message }}</small>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" icon="pi pi-times" @click="$emit('update:visible', false)" text />
        <Button :label="editMode ? 'Update' : 'Create'" icon="pi pi-check" @click="submitForm" :loading="loading" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { showSuccess, showApiError } from "@/utils/toast";
import { useVuelidate } from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import { createSupplier, updateSupplier } from "@/services/supplierService";

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

// Form data initialization
const form = reactive({
  name: "",
  phone: "",
  email: "",
  address: "",
});

// Validation rules
const rules = {
  name: { required },
  phone: { required },
  email: { required, email },
  address: { required },
};

const v$ = useVuelidate(rules, form);

// Reset form to initial state
const resetForm = () => {
  form.name = "";
  form.phone = "";
  form.email = "";
  form.address = "";
  submitted.value = false;
  v$.value.$reset();
};

// Submit form
const submitForm = async () => {
  submitted.value = true;
  const isValid = await v$.value.$validate();

  if (!isValid) {
    return;
  }

  try {
    loading.value = true;
    const formData = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
    };

    if (editMode.value) {
      await updateSupplier(props.editData.id, formData);
      showSuccess("Supplier berhasil diubah");
    } else {
      await createSupplier(formData);
      showSuccess("Supplier berhasil ditambahkan");
    }

    resetForm();
    emit("update:visible", false);
    emit("refresh");
  } catch (err) {
    showApiError(err);
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
      form.phone = newVal.phone || "";
      form.email = newVal.email || "";
      form.address = newVal.address || "";
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
