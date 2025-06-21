import { useRouter } from "vue-router";
import api from "@/services/api";
import { isLoading, errorMsg, errorAlert, clearErrors } from "./state";

export const useRegisterStore = () => {
  const router = useRouter();

  const registerUser = async ({ username, email, phone, password, passwordConfirm }) => {
    isLoading.value = true;
    clearErrors();

    try {
      console.log("Data pendaftaran yang dikirim:", { username, email, phone, password, passwordConfirm });

      const response = await api.post("/auth/register", {
        username,
        email,
        phone,
        password,
        passwordConfirm,
        name: username,
      });

      console.log("Respon pendaftaran:", response.data);

      if (!response.data || response.data.status !== "Success") {
        throw new Error(response.data?.message || "Status respon server bukan Success");
      }

      // Jika sukses
      setTimeout(() => {
        isLoading.value = false;
        router.push("/login");
      }, 1500);

      return response.data;
    } catch (error) {
      console.error("ERROR PENDAFTARAN:", error);
      isLoading.value = false;
      errorAlert.value = true;

      // Ekstrak pesan error dari berbagai format yang mungkin
      if (error.response?.data?.message) {
        errorMsg.value = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg.value = error.response.data.error;
      } else if (error.message) {
        errorMsg.value = error.message;
      } else {
        errorMsg.value = "Gagal mendaftar. Silakan coba lagi.";
      }

      throw error;
    }
  };

  return { registerUser };
};
