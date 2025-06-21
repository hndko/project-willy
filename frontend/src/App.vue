<template>
  <Toast ref="globalToast" />
  <router-view />
</template>

<script setup>
import Toast from "primevue/toast";
import { ref, onMounted } from "vue";
import { setToastInstance } from "@/utils/toast";

const globalToast = ref(null);
onMounted(() => {
  setToastInstance(globalToast.value);
});
</script>

<style>
:root {
  font-family: var(--font-primary, "DM Sans", sans-serif);
}

* {
  font-family: inherit;
}
</style>
