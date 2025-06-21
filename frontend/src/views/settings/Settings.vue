<template>
  <div class="settings-container">
    <Card class="mb-4">
      <template #header>
        <div class="flex justify-content-between align-items-center">
          <h2 class="m-0 text-2xl font-semibold">Profile Settings</h2>
        </div>
      </template>
      <template #content>
        <TabView>
          <TabPanel header="Profile Information">
            <ProfileForm :profile="profile" @update-success="handleProfileUpdateSuccess" />
          </TabPanel>
          <TabPanel header="Change Password">
            <PasswordForm @update-success="handlePasswordUpdateSuccess" />
          </TabPanel>
        </TabView>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import ProfileForm from "@/components/settings/ProfileForm.vue";
import PasswordForm from "@/components/settings/PasswordForm.vue";
import { getProfile } from "@/services/profileService";

const toast = useToast();
const profile = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await getProfile();
    profile.value = response.data;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to load profile. Please try again later.",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
});

const handleProfileUpdateSuccess = (message) => {
  toast.add({
    severity: "success",
    summary: "Success",
    detail: message || "Profile updated successfully",
    life: 3000,
  });
};

const handlePasswordUpdateSuccess = (message) => {
  toast.add({
    severity: "success",
    summary: "Success",
    detail: message || "Password changed successfully",
    life: 3000,
  });
};
</script>

<style scoped>
.settings-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

:deep(.p-card-header) {
  padding-bottom: 0;
}

:deep(.p-card-body) {
  padding-top: 0.5rem;
}

:deep(.p-tabview-panels) {
  padding: 1.25rem 0;
}
</style>
