import { useRouter } from "vue-router";
import api from "@/services/api";
import { email, password, isLoading, errors, errorMsg, errorAlert, clearErrors, setToken, setUser, saveFormData } from "./state";
import { watch } from "vue";

/**
 * Hook untuk login store
 * @returns {Object} Login store methods
 */
export const useLoginStore = () => {
  const router = useRouter();

  // Watch for changes to form fields and save them
  watch([email, password], () => {
    saveFormData();
  });

  /**
   * Validasi input login
   * @returns {boolean} True jika valid, false jika tidak
   */
  const validateLogin = () => {
    clearErrors();
    let isValid = true;

    // Validasi email
    if (!email.value || email.value.trim() === "") {
      errors.value.email = "Email wajib diisi";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.value)) {
      errors.value.email = "Format email tidak valid";
      isValid = false;
    }

    // Validasi password
    if (!password.value || password.value.trim() === "") {
      errors.value.password = "Password wajib diisi";
      isValid = false;
    } else if (password.value.length < 6) {
      errors.value.password = "Password minimal 6 karakter";
      isValid = false;
    }

    return isValid;
  };

  /**
   * Proses login user
   * @returns {Promise<void>}
   */
  const loginUser = async () => {
    // Validasi form
    clearErrors();
    if (!validateLogin()) return;

    try {
      isLoading.value = true;

      // Kirim request login
      const response = await api.post(
        "/auth/login",
        {
          email: email.value,
          password: password.value,
        },
        {
          // Explicitly set these for login request
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Login response:", response.data);

      // Verifikasi respons
      if (!response.data || response.status !== 200) {
        throw new Error("Respons server tidak valid");
      }

      // Ekstrak token dan data user
      const data = response.data.data || {};

      // Check for token directly from response or in User object
      const authToken = data.token || (data.User && data.User.token);

      if (!authToken) {
        console.error("No token found in response:", data);
        throw new Error("Token tidak ditemukan dalam respons");
      }

      // Simpan token dan user data
      const tokenSaved = setToken(authToken);
      const userSaved = setUser(data.User || data.user || {});

      if (!tokenSaved || !userSaved) {
        console.warn("Login berhasil tetapi gagal menyimpan data sesi");
      }

      // Set token untuk request berikutnya
      if (tokenSaved) {
        api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
      }

      // Tampilkan pesan sukses dan arahkan ke dashboard
      setTimeout(() => {
        isLoading.value = false;
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      isLoading.value = false;
      errorAlert.value = true;

      // Handling berbagai jenis error
      if (error.response) {
        // Error dari respons server
        const res = error.response.data;
        errorMsg.value = res.message || "Terjadi kesalahan saat login";

        // Handling error validasi
        if (res.errors) {
          if (res.errors.email) errors.value.email = res.errors.email[0];
          if (res.errors.password) errors.value.password = res.errors.password[0];
        }
      } else if (error.request) {
        // Request sudah dibuat tapi tidak ada respons (timeout/network issue)
        errorMsg.value = "Server tidak merespons, periksa koneksi internet Anda";
      } else {
        // Error umum
        errorMsg.value = error.message || "Tidak dapat terhubung ke server";
      }
    }
  };

  return { loginUser, validateLogin };
};
