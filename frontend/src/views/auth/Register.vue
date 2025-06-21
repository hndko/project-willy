<template>
  <section id="registerPage" class="w-screen h-screen">
    <!-- Head Nav -->

    <Header />

    <!-- section page -->

    <div class="grid grid-cols-12">
      <div class="flex flex-col items-center h-full col-span-7 py-22 bg-primary">
        <img src="../../../public/images/gambar-loginFix.png" alt="Illustration" class="mt-8 mb-8" />
        <b class="text-xl text-center text-white font-primary">Satu Kendali Dalam Genggaman</b>
      </div>

      <div class="flex h-screen col-span-5 px-6 py-20 overflow-y-auto">
        <div class="content-center w-full max-w-lg mt-15">
          <!-- Form Regist -->

          <FormRegisComponent />

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
            <p class="text-sm text-center text-gray-500 cursor-pointer font-primary">Sudah punya akun? <a href="/login" class="text-black hover:underline">Masuk</a></p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Header from "@/layouts/Header.vue";
import FormRegisComponent from "@/components/FormRegisComponent.vue";
</script>
