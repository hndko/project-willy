import { useToast } from "primevue/usetoast";

let toastInstance = null;
export function setToastInstance(instance) {
  toastInstance = instance;
}
function getToast() {
  return toastInstance || useToast();
}
export function showSuccess(detail, summary = "Berhasil") {
  getToast().add({ severity: "success", summary, detail, life: 3000 });
}
export function showError(detail, summary = "Gagal") {
  getToast().add({ severity: "error", summary, detail, life: 4000 });
}
export function showInfo(detail, summary = "Info") {
  getToast().add({ severity: "info", summary, detail, life: 3000 });
}
export function showWarn(detail, summary = "Peringatan") {
  getToast().add({ severity: "warn", summary, detail, life: 3000 });
}
export function showApiError(error, summary = "Gagal") {
  if (Array.isArray(error)) {
    error.forEach((msg) => showError(msg, summary));
  } else if (typeof error === "string") {
    showError(error, summary);
  } else if (error?.response?.data?.message) {
    showError(error.response.data.message, summary);
  } else if (error?.message) {
    showError(error.message, summary);
  } else {
    showError("Terjadi kesalahan", summary);
  }
}
