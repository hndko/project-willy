<template>
  <Dialog :visible="visible" :style="{ width: '450px' }" :header="editMode ? 'Edit Category' : 'Add Category'" :modal="true" class="p-fluid" @update:visible="$emit('update:visible', $event)">
    <div class="p-4">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label for="name" class="block mb-2 font-medium text-gray-700">Name</label>
          <InputText id="name" v-model="form.name" :class="{ 'p-invalid': v$.name.$invalid && submitted }" placeholder="Enter category name" required />
          <small v-if="v$.name.$invalid && submitted" class="p-error">{{ v$.name.$errors[0].$message }}</small>
        </div>

        <div class="mb-4">
          <label for="description" class="block mb-2 font-medium text-gray-700">Description</label>
          <Textarea id="description" v-model="form.description" rows="3" autoResize placeholder="Enter category description" />
          <small class="text-gray-500">Optional: Provide a description for this category</small>
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
import { required } from "@vuelidate/validators";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import { createCategory, updateCategory } from "@/services/categoryService";

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
  description: "",
});

// Validation rules
const rules = {
  name: { required },
};

const v$ = useVuelidate(rules, form);

// Reset form to initial state
const resetForm = () => {
  form.name = "";
  form.description = "";
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
      description: form.description,
    };

    if (editMode.value) {
      await updateCategory(props.editData.id, formData);
      showSuccess("Kategori berhasil diubah");
    } else {
      await createCategory(formData);
      showSuccess("Kategori berhasil ditambahkan");
    }

    resetForm();
    emit("update:visible", false);
    emit("refresh");
  } catch (error) {
    console.error("Error saving category:", error);
    showApiError(error.response?.data?.message || "Gagal menyimpan kategori");
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
