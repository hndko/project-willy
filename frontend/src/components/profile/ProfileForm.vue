<template>
  <form @submit.prevent="$emit('submit')">
    <!-- Full Name Field -->
    <div class="p-8 mb-4 bg-white shadow-md rounded-xl">
      <h3 class="mb-2 text-lg font-bold">Nama lengkap</h3>
      <div class="field">
        <InputText v-model="formData.full_name" class="w-full p-inputtext-lg" placeholder="Nama lengkap" :class="{ 'p-invalid': errors.full_name }" />
        <small v-if="errors.full_name" class="p-error">{{ errors.full_name }}</small>
      </div>
    </div>
    <!-- Email Field -->
    <div class="p-8 mb-4 bg-white shadow-md rounded-xl">
      <h3 class="mb-2 text-lg font-bold">Email</h3>
      <div class="field">
        <InputText v-model="formData.email" class="w-full p-inputtext-lg" placeholder="Email" :class="{ 'p-invalid': errors.email }" />
        <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
      </div>
    </div>
    <!-- Phone Number Field -->
    <div class="p-8 mb-4 bg-white shadow-md rounded-xl">
      <h3 class="mb-2 text-lg font-bold">Nomor handphone</h3>
      <div class="field">
        <InputText v-model="formData.phone_number" class="w-full p-inputtext-lg" placeholder="Nomor handphone" :class="{ 'p-invalid': errors.phone_number }" />
        <small v-if="errors.phone_number" class="p-error">{{ errors.phone_number }}</small>
      </div>
    </div>
    <!-- Password Fields -->
    <div class="px-4 py-8 mb-4 bg-white shadow-md rounded-xl">
      <h3 class="text-lg font-bold">Password Lama</h3>
      <div class="mb-2 field">
        <Password v-model="passwordData.current_password" class="w-full p-inputtext-lg" placeholder="Password lama" :feedback="false" toggleMask :class="{ 'p-invalid': passwordErrors.current_password }" />
        <small v-if="passwordErrors.current_password" class="p-error">{{ passwordErrors.current_password }}</small>
      </div>
      <h3 class="text-lg font-bold">Password Baru</h3>
      <div class="mb-2 field">
        <Password v-model="passwordData.new_password" class="w-full p-inputtext-lg" placeholder="Password baru" :feedback="false" toggleMask :class="{ 'p-invalid': passwordErrors.new_password }" />
        <small v-if="passwordErrors.new_password" class="p-error">{{ passwordErrors.new_password }}</small>
      </div>
      <h3 class="text-lg font-bold">Konfirmasi Password Baru</h3>
      <div class="field">
        <Password v-model="passwordData.confirm_password" class="w-full p-inputtext-lg" placeholder="Ulangi password baru" :feedback="false" toggleMask :class="{ 'p-invalid': passwordErrors.confirm_password }" />
        <small v-if="passwordErrors.confirm_password" class="p-error">{{ passwordErrors.confirm_password }}</small>
      </div>
      <div class="mt-6">
        <div class="p-4 rounded-lg bg-gray-50">
          <h4 class="mb-3 text-lg font-medium">Password harus memenuhi minimal 2 syarat:</h4>
          <ul class="pl-4 text-gray-600">
            <li class="mb-2">Ada huruf kapital</li>
            <li class="mb-2">Ada huruf kecil</li>
            <li class="mb-2">Ada angka</li>
            <li class="mb-2">Ada simbol seperti @, #, atau tanda lainnya</li>
          </ul>
        </div>
      </div>
    </div>
    <!-- Save Button -->
    <div>
      <Button label="Simpan" class="w-full p-3 text-xl font-bold" type="submit" :loading="loading" />
    </div>
  </form>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";

defineProps({
  formData: Object,
  passwordData: Object,
  errors: Object,
  passwordErrors: Object,
  loading: Boolean,
});
defineEmits(["submit"]);
</script>
