<template>
  <div class="flex flex-col w-full">
    <!-- Heading Text -->
    <p class="mb-6 text-2xl font-bold text-center text-gray-900 font-primary">Daftar ke Smart App</p>

    <!-- Form Registration -->
    <div class="flex justify-center py-3">
      <Form v-slot="$form" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit" class="flex flex-col w-full max-w-full gap-2">
        <div class="flex flex-col mb-5">
          <p class="font-semibold font-primary">Username</p>
          <InputText name="username" type="text" placeholder="Masukan username yang valid" :feedback="false" fluid />
          <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{ $form.username.error?.message }}</Message>
        </div>

        <div class="flex flex-col mb-5">
          <p class="font-semibold font-primary">Email</p>
          <InputText name="email" type="text" placeholder="Masukan alamat email yang valid" class="w-full py-2" autocomplete="email" :feedback="false" fluid />
          <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">{{ $form.email.error?.message }}</Message>
        </div>

        <div class="flex flex-col mb-5">
          <p class="font-semibold font-primary">Nomor Telepon</p>
          <InputMask v-model="phone" name="phone" type="text" mask="999999999999" placeholder="Masukan nomor telepon yang valid" class="w-full py-2" autocomplete="phone" fluid />
          <Message v-if="$form.phone?.invalid" severity="error" size="small" variant="simple">{{ $form.phone.error?.message }}</Message>
        </div>

        <div class="flex w-full gap-x-6">
          <div class="w-1/2">
            <p class="mb-2 font-semibold font-primary">Password</p>
            <Password name="password" placeholder="Masukan Password" :feedback="false" toggleMask fluid />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              <ul class="flex flex-col gap-1 px-4 my-0">
                <li v-for="(error, index) of $form.password.errors" :key="index">{{ error.message }}</li>
              </ul>
            </Message>
          </div>

          <div class="w-1/2">
            <p class="mb-2 font-semibold font-primary">Konfirmasi Password</p>
            <Password name="confirmPassword" placeholder="Konfirmasi Password" :feedback="false" toggleMask fluid autocomplete="new-password" />
            <Message v-if="$form.confirmPassword?.invalid" severity="error" size="small" variant="simple">
              {{ $form.confirmPassword.error?.message }}
            </Message>
          </div>
        </div>

        <Message v-if="auth.errorMsg" severity="error" variant="simple">{{ auth.errorMsg }}</Message>

        <Button type="submit" severity="secondary" :label="auth.isLoading ? 'Sedang Mendaftar...' : 'Daftar'" :disabled="auth.isLoading" class="py-2 mt-4 text-white rounded-lg font-primary bg-primary hover:bg-primary/75" />
      </Form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "../stores/auth/indexAuth";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";
import { useToast } from "primevue/usetoast";
import { Form } from "@primevue/forms";
import { ref } from "vue";
import InputText from "primevue/inputtext";
import InputMask from "primevue/inputmask";
import Button from "primevue/button";
import Message from "primevue/message";
import Password from "primevue/password";

const auth = useAuthStore();
const toast = useToast();
const registerError = ref(null);
const phone = ref("");

const initialValues = ref({
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

const schema = z
  .object({
    username: z
      .string()
      .min(1, { message: "Username wajib diisi." })
      .refine((val) => val.length >= 5, { message: "Minimum 5 karakter huruf." }),

    email: z.string().min(1, { message: "Email wajib diisi." }).email("Format tidak sesuai, contoh: me@mail.com."),

    phone: z
      .string()
      .min(1, { message: "Nomor telepon wajib diisi." })
      .refine((val) => val.length >= 10, { message: "Minimum 10 karakter angka." }),

    password: z.preprocess(
      (val) => {
        if (typeof val !== "string" || val.trim() === "") {
          return ""; // biar gagal langsung di min(1)
        }
        return val;
      },
      z
        .string()
        .min(1, { message: "Password wajib diisi." }) // ditrigger saat kosong
        .superRefine((val, ctx) => {
          if (val.length > 0) {
            if (val.length < 5) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Minimal 5 karakter." });
            if (val.length > 12) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Maksimal 12 karakter." });
            if (!/[a-z]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ada huruf kecil." });
            if (!/[A-Z]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ada huruf besar." });
            if (!/[0-9]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Harus menggunakan angka." });
          }
        })
    ),

    confirmPassword: z.string().min(1, { message: "Konfirmasi password wajib diisi." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password tidak sama.",
  });

const resolver = zodResolver(schema);

const onFormSubmit = async (formState) => {
  console.log("ONFORMSUBMIT JALAN");
  console.log("FormState:", formState);

  // Hapus error sebelumnya
  registerError.value = null;

  // In PrimeVue v4 Form API, form values are in formState.values instead of formState.data
  const formData = formState.values;
  console.log("DATA YANG AKAN DIKIRIM:", formData);

  if (!formState.valid) return;

  try {
    await auth.registerUser({
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      passwordConfirm: formData.confirmPassword,
    });

    toast.add({
      severity: "success",
      summary: "Pendaftaran berhasil!",
      detail: "Anda akan dialihkan ke halaman login",
      life: 3000,
    });
  } catch (err) {
    console.error("Error saat pendaftaran:", err);
    registerError.value = err.message || auth.errorMsg || "Terjadi kesalahan saat proses pendaftaran";

    toast.add({
      severity: "error",
      summary: "Gagal mendaftar",
      detail: registerError.value,
      life: 5000,
    });
  }
};
</script>

<style scoped></style>
