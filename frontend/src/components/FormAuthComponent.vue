<template>
  <div class="flex flex-col w-full">
    <!-- Heading Text -->
    <p class="mb-6 text-2xl font-bold text-center text-gray-900 font-primary">Masuk ke Smart App</p>

    <!-- From Login -->
    <div class="flex justify-center py-3">
      <Toast />
      <Form :resolver @submit="onFormSubmit" class="flex flex-col w-full max-w-full gap-3 mb-5">
        <p class="font-semibold font-primary">Email</p>
        <FormField v-slot="$field" as="section" name="email" initialValue="" class="flex flex-col gap-2">
          <InputText v-model="auth.email" type="text" placeholder="Masukan alamat email yang terdaftar" class="w-full py-2" autocomplete="email" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
        </FormField>
        <FormField v-slot="$field" asChild name="password" initialValue="">
          <section class="flex flex-col gap-3 mb-5">
            <p class="font-semibold font-primary">Password</p>
            <Password v-model="auth.password" type="password" placeholder="Masukan password" :feedback="false" toggleMask class="cursor-pointer" fluid autocomplete="current-password" />
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
          </section>
        </FormField>
        <Button type="submit" severity="secondary" :label="auth.isLoading ? 'Sedang masuk...' : 'Masuk'" :disabled="auth.isLoading" class="py-2 text-white rounded-lg font-primary bg-primary hover:bg-primary/75" />
      </Form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "../stores/auth/indexAuth";
import { useRouter } from "vue-router";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";
import { useToast } from "primevue/usetoast";
import { Form } from "@primevue/forms";
import { FormField } from "@primevue/forms";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Message from "primevue/message";
import Password from "primevue/password";
import Toast from "primevue/toast";

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();

const resolver = zodResolver(
  z.object({
    email: z.string().min(1, { message: "Email wajib diisi." }).email("Format tidak sesuai, contoh: me@mail.com."),
    password: z.string().min(1, { message: "Password wajib diisi." }),
  })
);

const onFormSubmit = async ({ valid }) => {
  if (!valid) return;

  try {
    auth.isLoading = true;

    console.log("Attempting login with:", {
      email: auth.email,
      password: "***", // Don't log actual password
    });

    // Use fetch with better error handling
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: auth.email,
        password: auth.password,
      }),
      credentials: "include",
    });

    console.log("Login response status:", response.status);

    // Read response as text first for debugging
    const responseText = await response.text();
    console.log("Response body text:", responseText);

    // Try to parse as JSON if possible
    let data = null;
    try {
      data = JSON.parse(responseText);
      console.log("Parsed response data:", data);
    } catch (e) {
      console.warn("Could not parse response as JSON:", e);
    }

    if (response.ok) {
      // Login successful
      toast.add({ severity: "success", summary: "Berhasil masuk", life: 3000 });

      // If we have data, store token and user info
      if (data && data.data) {
        if (data.data.token) {
          localStorage.setItem("token", data.data.token);
        }

        if (data.data.User) {
          localStorage.setItem("user", JSON.stringify(data.data.User));
        }
      }

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } else {
      // Handle error response
      const errorMessage = data && data.message ? data.message : "Mohon periksa email dan password Anda";

      toast.add({
        severity: "error",
        summary: "Login gagal",
        detail: errorMessage,
        life: 3000,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    toast.add({
      severity: "error",
      summary: "Login gagal",
      detail: "Terjadi kesalahan. Silakan coba lagi nanti.",
      life: 3000,
    });
  } finally {
    auth.isLoading = false;
  }
};
</script>

<style scoped></style>
