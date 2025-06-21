<template>
  <div class="password-form">
    <form @submit.prevent="changePassword">
      <div class="p-fluid">
        <div class="field">
          <label for="current_password">Current Password</label>
          <Password id="current_password" v-model="formData.current_password" :class="{ 'p-invalid': errors.current_password }" :feedback="false" toggleMask inputClass="w-full" aria-describedby="current-password-error" />
          <small v-if="errors.current_password" id="current-password-error" class="p-error">
            {{ errors.current_password }}
          </small>
        </div>

        <div class="field">
          <label for="new_password">New Password</label>
          <Password id="new_password" v-model="formData.new_password" :class="{ 'p-invalid': errors.new_password }" toggleMask inputClass="w-full" aria-describedby="new-password-error" />
          <small v-if="errors.new_password" id="new-password-error" class="p-error">
            {{ errors.new_password }}
          </small>
        </div>

        <div class="field">
          <label for="confirm_password">Confirm New Password</label>
          <Password id="confirm_password" v-model="formData.confirm_password" :class="{ 'p-invalid': errors.confirm_password }" :feedback="false" toggleMask inputClass="w-full" aria-describedby="confirm-password-error" />
          <small v-if="errors.confirm_password" id="confirm-password-error" class="p-error">
            {{ errors.confirm_password }}
          </small>
        </div>

        <div class="flex mt-3 justify-content-end">
          <Button type="button" label="Reset" icon="pi pi-refresh" class="mr-2 p-button-secondary" @click="resetForm" />
          <Button type="submit" label="Change Password" icon="pi pi-lock" :loading="loading" />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import Button from "primevue/button";
import Password from "primevue/password";
import { updatePassword } from "@/services/profileService";

const emit = defineEmits(["update-success"]);

const loading = ref(false);
const errors = ref({});

const formData = reactive({
  current_password: "",
  new_password: "",
  confirm_password: "",
});

// Basic validation
const validateForm = () => {
  errors.value = {};

  if (!formData.current_password) {
    errors.value.current_password = "Current password is required";
  }

  if (!formData.new_password) {
    errors.value.new_password = "New password is required";
  } else if (formData.new_password.length < 6) {
    errors.value.new_password = "Password must be at least 6 characters long";
  }

  if (!formData.confirm_password) {
    errors.value.confirm_password = "Please confirm your new password";
  } else if (formData.new_password !== formData.confirm_password) {
    errors.value.confirm_password = "Passwords do not match";
  }

  return Object.keys(errors.value).length === 0;
};

const changePassword = async () => {
  const isValid = validateForm();

  if (!isValid) return;

  loading.value = true;
  try {
    await updatePassword(formData);
    emit("update-success", "Password changed successfully");
    resetForm();
  } catch (error) {
    console.error("Error changing password:", error);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  formData.current_password = "";
  formData.new_password = "";
  formData.confirm_password = "";
  errors.value = {};
};
</script>

<style scoped>
.password-form {
  max-width: 600px;
  margin: 0 auto;
}
</style>
