<template>
  <Toast />
  <DashboardLayout pageTitle="Users Management">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Users List</h2>
          <Button label="Add User" icon="pi pi-user-plus" @click="openAddUser" />
        </div>
      </template>
      <template #content>
        <UserTable :users="users" :userRole="userRole" @edit="openEditUser" @delete="removeUser" @toggle-status="toggleUserStatus" />
      </template>
    </Card>

    <!-- Modal Add/Edit User -->
    <Dialog v-model:visible="userDialog" :header="dialogTitle" :modal="true" :closable="true" :style="{ width: '400px' }">
      <UserForm :formData="formData" :roles="roleOptions" :statusOptions="statusOptions" :loading="saving" :editing="!!editingUserId" :userRole="userRole" @submit="saveUser" @cancel="closeDialog" />
    </Dialog>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import UserTable from "@/components/users/UserTable.vue";
import UserForm from "@/components/users/UserForm.vue";
import { getUsers, createUser, updateUser, deleteUser } from "@/services/userService";
import { getRoles } from "@/services/roleService";
import { showSuccess, showApiError } from "@/utils/toast";
import Toast from "primevue/toast";
import api from "@/utils/apiInterceptor";

const users = ref([]);
const roles = ref([]);
const userDialog = ref(false);
const saving = ref(false);
const editingUserId = ref(null);
const formData = reactive({
  name: "",
  email: "",
  phone: "",
  role_id: null,
  is_active: true,
});
const userRole = ref("");

const statusOptions = [
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

const roleOptions = computed(() => roles.value);
const dialogTitle = computed(() => (editingUserId.value ? "Edit User" : "Add User"));

const fetchUsers = async () => {
  const res = await getUsers();
  users.value = res.data.data || [];
};
const fetchRoles = async () => {
  const res = await getRoles();
  roles.value = res.data.data || [];
};
const fetchCurrentUserRole = async () => {
  try {
    const res = await api.get("/auth/me");
    let roleName = res.data?.data?.Role?.name || res.data?.data?.Role || "";
    if (typeof roleName === "string") roleName = roleName.toLowerCase();
    userRole.value = roleName;
    console.log("[DEBUG] userRole fetched:", roleName, res.data);
  } catch (e) {
    userRole.value = "";
    console.error("[DEBUG] fetchCurrentUserRole error", e);
  }
};

onMounted(() => {
  fetchUsers();
  fetchRoles();
  fetchCurrentUserRole();
});

function openAddUser() {
  if (!isAdminOrOwner.value) {
    showApiError("Hanya admin/owner yang bisa menambah user", "Permission Denied");
    return;
  }
  editingUserId.value = null;
  Object.assign(formData, { name: "", email: "", phone: "", role_id: null, is_active: true });
  userDialog.value = true;
}
function openEditUser(user) {
  if (!isAdminOrOwner.value) {
    showApiError("Hanya admin/owner yang bisa edit user", "Permission Denied");
    return;
  }
  editingUserId.value = user.id;
  Object.assign(formData, {
    name: user.name,
    email: user.email,
    phone: user.phone,
    role_id: user.role_id,
    is_active: user.is_active,
  });
  userDialog.value = true;
}
function closeDialog() {
  userDialog.value = false;
}
const isAdminOrOwner = computed(() => userRole.value === "admin" || userRole.value === "owner");
async function saveUser() {
  if (!isAdminOrOwner.value) {
    showApiError("Hanya admin/owner yang bisa menyimpan user", "Permission Denied");
    return;
  }
  // Validasi manual
  if (!formData.name || !formData.email || !formData.phone || !formData.role_id) {
    showApiError("Semua field wajib diisi", "Form tidak lengkap");
    return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(formData.email)) {
    showApiError("Masukkan email yang valid", "Format Email Salah");
    return;
  }
  if (formData.phone.length < 10) {
    showApiError("Nomor telepon minimal 10 digit", "Format Nomor Salah");
    return;
  }
  saving.value = true;
  try {
    if (editingUserId.value) {
      await updateUser(editingUserId.value, formData);
      showSuccess("Data user berhasil diupdate", "User diupdate");
    } else {
      await createUser(formData);
      showSuccess("User baru berhasil ditambahkan", "User ditambah");
    }
    userDialog.value = false;
    await fetchUsers();
  } catch (err) {
    showApiError(err?.response?.data?.message || "Terjadi kesalahan", "Gagal");
  } finally {
    saving.value = false;
  }
}
async function removeUser(user) {
  if (!isAdminOrOwner.value) {
    showApiError("Hanya admin/owner yang bisa menghapus user", "Permission Denied");
    return;
  }
  if (confirm(`Delete user ${user.name}?`)) {
    await deleteUser(user.id);
    fetchUsers();
    showSuccess("User berhasil dihapus", "User dihapus");
  }
}
async function toggleUserStatus(user) {
  if (!isAdminOrOwner.value) {
    showApiError("Hanya admin/owner yang bisa mengubah status user", "Permission Denied");
    return;
  }
  try {
    await updateUser(user.id, { is_active: user.is_active });
    showSuccess(`Status user ${user.name} diubah menjadi ${user.is_active ? "Active" : "Inactive"}`, "Status diupdate");
    await fetchUsers();
  } catch (err) {
    showApiError(err?.response?.data?.message || "Gagal update status", "Gagal");
    await fetchUsers();
  }
}

watch(userRole, (val) => {
  console.log("[DEBUG] userRole:", val);
});
</script>
