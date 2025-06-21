import { useRouter } from "vue-router";
import api from "@/services/api";
import { isLoading, resetAuthState } from "./state";

/**
 * Hook untuk logout store
 * @returns {Object} Logout store methods
 */
export const useLogoutStore = () => {
  const router = useRouter();

  /**
   * Logout user dari aplikasi
   * @returns {Promise<void>}
   */
  const logoutUser = async () => {
    try {
      isLoading.value = true;

      // Panggil API logout
      await api.post("/auth/logout");

      // Hapus header Authorization
      delete api.defaults.headers.common["Authorization"];

      // Reset semua state auth
      resetAuthState();

      // Redirect ke halaman login
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);

      // Tetap reset state auth meskipun error
      resetAuthState();
      router.push("/login");
    } finally {
      isLoading.value = false;
    }
  };

  return { logoutUser };
};
