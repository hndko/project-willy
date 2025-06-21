<template>
  <section id="loginPage">
    <!-- header -->

    <Header />

    <!-- section page -->

    <div class="grid grid-cols-12">
      <div class="flex flex-col items-center h-screen col-span-7 py-20 bg-primary">
        <img src="../../../public/images/gambar-loginFix.png" alt="Illustration" class="mt-8 mb-8" />
        <b class="text-xl text-center text-white font-primary">Satu Kendali Dalam Genggaman</b>
      </div>

      <div class="flex h-screen col-span-5 px-6 py-20">
        <div class="content-center w-full max-w-lg mt-15">
          <!-- Form Auth -->
          <FormAuthComponent />
          <!-- form register -->
          <div class="relative mb-8">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border border-gray-300"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-4 text-sm text-gray-500 bg-white">Atau</span>
            </div>
          </div>
          <div class="relative w-full">
            <p class="text-sm text-center text-gray-500 cursor-pointer font-primary">Belum punya akun? <a href="/register" class="text-black hover:underline">Daftar</a></p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Header from "@/layouts/Header.vue";
import FormAuthComponent from "@/components/FormAuthComponent.vue";
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth/indexAuth";

const auth = useAuthStore();

onMounted(() => {
  auth.resetAuthState();
});
</script>
