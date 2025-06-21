<template>
  <div class="profile-form">
    <div v-if="loading" class="flex justify-content-center">
      <ProgressSpinner />
    </div>
    <div v-else class="grid">
      <!-- Profile picture upload -->
      <div class="flex col-12 md:col-4 flex-column align-items-center">
        <div class="mb-3 profile-image-container">
          <img :src="profileImage || 'https://ui-avatars.com/api/?name=User&background=random'" @error="onImageError" alt="Profile picture" class="profile-image" />
          <div class="upload-overlay">
            <label for="profile_picture" class="upload-button">
              <i class="pi pi-camera"></i>
            </label>
            <input type="file" id="profile_picture" accept="image/*" class="hidden" @change="handleImageUpload" />
          </div>
        </div>
        <Button v-if="imageFile" label="Upload Picture" icon="pi pi-upload" @click="uploadProfilePicture" :loading="uploading" class="w-full mb-2" />
      </div>

      <!-- Profile information form -->
      <div class="col-12 md:col-8">
        <form @submit.prevent="updateProfile">
          <div class="p-fluid">
            <div class="field">
              <label for="full_name">Full Name</label>
              <InputText id="full_name" v-model="formData.full_name" :class="{ 'p-invalid': errors.full_name }" aria-describedby="full_name-error" />
              <small v-if="errors.full_name" id="full_name-error" class="p-error">
                {{ errors.full_name }}
              </small>
            </div>

            <div class="field">
              <label for="email">Email</label>
              <InputText id="email" v-model="formData.email" :class="{ 'p-invalid': errors.email }" aria-describedby="email-error" />
              <small v-if="errors.email" id="email-error" class="p-error">
                {{ errors.email }}
              </small>
            </div>

            <div class="field">
              <label for="phone_number">Phone Number</label>
              <InputText id="phone_number" v-model="formData.phone_number" :class="{ 'p-invalid': errors.phone_number }" aria-describedby="phone-error" />
              <small v-if="errors.phone_number" id="phone-error" class="p-error">
                {{ errors.phone_number }}
              </small>
            </div>

            <div class="flex mt-3 justify-content-end">
              <Button type="submit" label="Save Changes" icon="pi pi-check" :loading="saving" />
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import ProgressSpinner from "primevue/progressspinner";
import { updateProfile as apiUpdateProfile, updateProfilePicture } from "@/services/profileService";

const props = defineProps({
  profile: Object,
});

const emit = defineEmits(["update-success"]);

const loading = ref(false);
const saving = ref(false);
const uploading = ref(false);
const imageFile = ref(null);
const profileImage = ref(null);
const errors = ref({});

const formData = reactive({
  full_name: "",
  email: "",
  phone_number: "",
});

// Basic validation
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
    errors.value.phone_number = "Phone number must be at least 10 digits";
  }

  return Object.keys(errors.value).length === 0;
};

// Image error handling
const onImageError = () => {
  // Fallback to default avatar
  profileImage.value = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formData.full_name || "User") + "&background=random";
};

// Update form when profile data changes
watch(
  () => props.profile,
  (newValue) => {
    if (newValue) {
      formData.full_name = newValue.full_name || "";
      formData.email = newValue.email || "";
      formData.phone_number = newValue.phone_number || "";

      if (newValue.profile_picture) {
        profileImage.value = `/uploads/${newValue.profile_picture}`;
      } else {
        // Generate avatar based on name
        onImageError();
      }
    }
  },
  { immediate: true }
);

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    imageFile.value = file;
    profileImage.value = URL.createObjectURL(file);
  }
};

const uploadProfilePicture = async () => {
  if (!imageFile.value) return;

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("profile_picture", imageFile.value);

    const response = await updateProfilePicture(formData);

    // Update the profile image with the new one
    if (response.data && response.data.data.image_url) {
      profileImage.value = response.data.data.image_url;
    }

    imageFile.value = null;
    emit("update-success", "Profile picture updated successfully");
  } catch (error) {
    console.error("Error uploading profile picture:", error);
  } finally {
    uploading.value = false;
  }
};

const updateProfile = async () => {
  const isValid = validateForm();

  if (!isValid) return;

  saving.value = true;
  try {
    await apiUpdateProfile(formData);
    emit("update-success", "Profile information updated successfully");
  } catch (error) {
    console.error("Error updating profile:", error);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.profile-image-container {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
</style>
