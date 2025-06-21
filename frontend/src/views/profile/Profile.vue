<template>
  <DashboardLayout pageTitle="Profile User">
    <div class="py-6 profile-page">
      <!-- Back button -->
      <div class="w-11/12 mx-auto mb-4 md:container">
        <Button icon="pi pi-arrow-left" text class="p-button-text" @click="$router.back()" />
      </div>

      <div v-if="loading" class="flex justify-content-center">
        <ProgressSpinner />
      </div>
      <div v-else class="w-11/12 mx-auto md:container">
        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- Left Column: Profile Image -->
          <div class="p-8 bg-white shadow-md rounded-xl">
            <div class="flex flex-col items-center justify-center">
              <div class="mb-6 profile-image-container">
                <img v-if="hasProfileImage" :src="profileImage" @error="onImageError" alt="Profile picture" class="profile-image" />
                <div v-else class="profile-initials">
                  <span>{{ userInitials }}</span>
                </div>
                <div class="upload-overlay">
                  <label for="profile_picture" class="upload-button">
                    <i class="pi pi-camera"></i>
                  </label>
                  <input type="file" id="profile_picture" accept="image/*" class="hidden" @change="handleImageUpload" />
                </div>
              </div>
              <Button v-if="imageFile" label="Upload Picture" icon="pi pi-upload" @click="uploadProfilePicture" :loading="uploading" class="w-full mb-4" />

              <!-- Role Information -->
              <div class="w-full mt-4">
                <h3 class="mb-4 text-2xl font-bold">Penjelasan peran</h3>

                <div class="mb-4">
                  <h4 class="mb-1 font-bold">Owner:</h4>
                  <p class="text-gray-600">pemilik usaha dan bisa mengakses semua fitur di Smart App.</p>
                </div>

                <div class="mb-4">
                  <h4 class="mb-1 font-bold">Admin:</h4>
                  <p class="text-gray-600">karyawan yang membantu mengelola order di toko. Mendapat hak akses fitur yang terbatas.</p>
                </div>

                <div>
                  <h4 class="mb-1 font-bold">Shipper:</h4>
                  <p class="text-gray-600">karyawan yang bertugas mengirim barang. Ia hanya memiliki hak akses fitur terkait pengiriman.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Profile Form -->
          <div class="flex flex-col space-y-3">
            <ProfileForm :formData="formData" :passwordData="passwordData" :errors="errors" :passwordErrors="passwordErrors" :loading="saving" @submit="updateProfile" />
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted, provide, computed } from "vue";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import ProgressSpinner from "primevue/progressspinner";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import { getProfile, updateProfile as apiUpdateProfile, updateProfilePicture, updatePassword as apiUpdatePassword } from "@/services/profileService";
import ProfileForm from "@/components/profile/ProfileForm.vue";

const toast = useToast();
const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const imageFile = ref(null);
const profileImage = ref(null);
const errors = ref({});
const passwordErrors = ref({});

const profileData = ref({
  id: null,
  user_id: null,
  full_name: "",
  email: "",
  phone_number: "",
  profile_picture: "",
  is_complete: false,
  user: {
    username: "",
    email: "",
    name: "",
    phone: "",
  },
});

// Check if user has a profile image
const hasProfileImage = computed(() => {
  return !!profileImage.value && !profileImage.value.includes("ui-avatars.com");
});

// Get user's initials from full name
const userInitials = computed(() => {
  const fullName = profileData.value.full_name || "";
  if (!fullName) return "U";

  const names = fullName.split(" ");
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }

  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
});

const formData = reactive({
  full_name: "",
  email: "",
  phone_number: "",
});

const passwordData = reactive({
  current_password: "",
  new_password: "",
  confirm_password: "",
});

// Allow DashboardLayout to use our profile data
provide("profileUpdate", {
  imageChanged: false,
  imagePath: null,
});

// Load profile data when component mounts
onMounted(async () => {
  try {
    loading.value = true;
    const response = await getProfile();

    if (response.data && response.data.data) {
      profileData.value = response.data.data;

      // Initialize form data
      formData.full_name = profileData.value.full_name || "";
      formData.email = profileData.value.email || "";
      formData.phone_number = profileData.value.phone_number || "";

      // Set profile image if available
      if (profileData.value.profile_picture) {
        profileImage.value = `/uploads/${profileData.value.profile_picture}`;
      } else {
        // Set to null to trigger the initials display
        profileImage.value = null;
      }
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to load profile data",
      life: 3000,
    });
    console.error("Error loading profile:", error);
  } finally {
    loading.value = false;
  }
});

// Basic form validation
const validateForm = () => {
  errors.value = {};

  if (!formData.full_name) {
    errors.value.full_name = "Full name is required";
  }

  if (!formData.email) {
    errors.value.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.value.email = "Please enter a valid email";
  }

  if (!formData.phone_number) {
    errors.value.phone_number = "Phone number is required";
  } else if (!/^\d{10,15}$/.test(formData.phone_number.replace(/\D/g, ""))) {
    errors.value.phone_number = "Phone number must be 10-15 digits";
  }

  // Password validation
  if (passwordData.current_password || passwordData.new_password || passwordData.confirm_password) {
    if (!passwordData.current_password) {
      passwordErrors.value.current_password = "Current password is required to change password";
    }

    if (!passwordData.new_password) {
      passwordErrors.value.new_password = "New password is required";
    }

    if (!passwordData.confirm_password) {
      passwordErrors.value.confirm_password = "Please confirm your new password";
    } else if (passwordData.current_password === passwordData.new_password) {
      passwordErrors.value.new_password = "New password must be different from the current password";
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      passwordErrors.value.confirm_password = "Passwords do not match";
    } else {
      // Check password requirements
      let criteria = 0;
      const pwd = passwordData.new_password;
      if (pwd && /[A-Z]/.test(pwd)) criteria++;
      if (pwd && /[a-z]/.test(pwd)) criteria++;
      if (pwd && /[0-9]/.test(pwd)) criteria++;
      if (pwd && /[^A-Za-z0-9]/.test(pwd)) criteria++;

      if (criteria < 2) {
        passwordErrors.value.new_password = "Password must meet at least 2 of the requirements";
      }
    }
  }

  return Object.keys(errors.value).length === 0 && Object.keys(passwordErrors.value).length === 0;
};

// Handle profile image error
const onImageError = () => {
  // Set image to null to trigger the initials display
  profileImage.value = null;
};

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    imageFile.value = file;
    profileImage.value = URL.createObjectURL(file);
  }
};

// Upload profile picture
const uploadProfilePicture = async () => {
  if (!imageFile.value) return;

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("profile_picture", imageFile.value);

    const response = await updateProfilePicture(formData);

    if (response.data && response.data.data) {
      // Update the profile image
      const imagePath = response.data.data.image_url;
      profileImage.value = imagePath;

      // Update the profile data
      profileData.value.profile_picture = response.data.data.profile_picture;

      // Notify parent layout to update header image
      provide("profileUpdate", {
        imageChanged: true,
        imagePath: imagePath,
      });

      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Profile picture updated successfully",
        life: 3000,
      });

      imageFile.value = null;

      // Refresh page to update header with new profile image
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to upload profile picture",
      life: 3000,
    });
    console.error("Error uploading profile picture:", error);
  } finally {
    uploading.value = false;
  }
};

// Update profile information and password if provided
const updateProfile = async () => {
  if (!validateForm()) return;

  saving.value = true;
  let profileSuccess = false;
  let passwordSuccess = false;
  let passwordErrorMsg = "";

  try {
    // Update profile info
    const profileResponse = await apiUpdateProfile(formData);
    if (profileResponse.data && profileResponse.data.data) {
      profileData.value = profileResponse.data.data;
      profileSuccess = true;
    }

    // Update password jika ada field diisi
    if (passwordData.current_password || passwordData.new_password || passwordData.confirm_password) {
      if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
        passwordErrorMsg = "Semua field password harus diisi";
      } else if (passwordData.new_password !== passwordData.confirm_password) {
        passwordErrorMsg = "Password baru dan konfirmasi tidak sama";
      } else if (passwordData.current_password === passwordData.new_password) {
        passwordErrorMsg = "Password baru tidak boleh sama dengan password lama";
      } else {
        try {
          await apiUpdatePassword({
            current_password: passwordData.current_password,
            new_password: passwordData.new_password,
            confirm_password: passwordData.confirm_password,
          });
          passwordSuccess = true;
          // Reset field password
          passwordData.current_password = "";
          passwordData.new_password = "";
          passwordData.confirm_password = "";
        } catch (err) {
          passwordErrorMsg = err.response?.data?.message || "Gagal update password";
        }
      }
    }

    // Notifikasi
    if (profileSuccess) {
      toast.add({ severity: "success", summary: "Success", detail: "Profile updated successfully", life: 3000 });
    }
    if (passwordSuccess) {
      toast.add({ severity: "success", summary: "Success", detail: "Password updated successfully, silakan login ulang.", life: 2000 });
      setTimeout(() => {
        // Hapus token dari localStorage/cookie jika ada
        localStorage.removeItem("token");
        // Redirect ke halaman login
        router.push("/auth/login");
      }, 2000);
      return; // Stop proses agar user tidak lanjut di halaman ini
    }
    if (passwordErrorMsg) {
      toast.add({ severity: "error", summary: "Error", detail: passwordErrorMsg, life: 4000 });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.response?.data?.message || "Failed to update profile",
      life: 3000,
    });
    console.error("Error updating profile:", error);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-card,
.role-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.profile-image-container {
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-initials {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, #ffc107 75%, #9e7e24 25%);
  color: #000;
  font-size: 3.5rem;
  font-weight: 600;
  text-transform: uppercase;
}

.upload-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  padding: 8px 0;
  transition: all 0.3s ease;
}

.upload-button {
  color: white;
  cursor: pointer;
  font-size: 1.5rem;
}

.hidden {
  display: none;
}

/* Override PrimeVue styles */
:deep(.p-inputtext) {
  padding: 1rem;
  font-size: 1rem;
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

:deep(.p-password-input) {
  width: 100%;
}

:deep(.p-button) {
  border-radius: 0.375rem;
}
</style>
