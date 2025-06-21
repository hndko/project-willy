<template>
  <DashboardLayout pageTitle="Dashboard">
    <!-- Overview Cards -->
    <div class="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card class="shadow-sm">
        <template #content>
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p class="text-2xl font-bold text-primary">Rp 56.800.000</p>
              <p class="text-xs text-green-500"><i class="mr-1 pi pi-arrow-up"></i> 12% dari bulan lalu</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 text-blue-500 bg-blue-100 rounded-full">
              <i class="text-xl pi pi-money-bill"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500">Transaksi</h3>
              <p class="text-2xl font-bold text-primary">245</p>
              <p class="text-xs text-green-500"><i class="mr-1 pi pi-arrow-up"></i> 8% dari bulan lalu</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 text-green-500 bg-green-100 rounded-full">
              <i class="text-xl pi pi-shopping-cart"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500">Pelanggan</h3>
              <p class="text-2xl font-bold text-primary">56</p>
              <p class="text-xs text-green-500"><i class="mr-1 pi pi-arrow-up"></i> 18% dari bulan lalu</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 rounded-full text-violet-500 bg-violet-100">
              <i class="text-xl pi pi-users"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500">Produk</h3>
              <p class="text-2xl font-bold text-primary">123</p>
              <p class="text-xs text-yellow-500"><i class="mr-1 pi pi-minus"></i> 0% dari bulan lalu</p>
            </div>
            <div class="flex items-center justify-center w-12 h-12 text-yellow-500 bg-yellow-100 rounded-full">
              <i class="text-xl pi pi-box"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content Section -->
    <div class="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
      <!-- Recent Transactions -->
      <Card class="shadow-sm lg:col-span-2">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Transaksi Terbaru</h2>
            <Button label="Lihat Semua" icon="pi pi-external-link" class="p-button-text p-button-sm" />
          </div>
        </template>
        <template #content>
          <DataTable :value="recentTransactions" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
            <Column field="id" header="ID" class="w-16 text-xs" />
            <Column field="customer" header="Pelanggan">
              <template #body="slotProps">
                <div class="flex items-center">
                  <Avatar :image="slotProps.data.avatar" class="mr-2" size="small" />
                  <span>{{ slotProps.data.customer }}</span>
                </div>
              </template>
            </Column>
            <Column field="date" header="Tanggal" />
            <Column field="amount" header="Jumlah" />
            <Column field="status" header="Status">
              <template #body="slotProps">
                <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
              </template>
            </Column>
            <Column header="Aksi" class="w-20">
              <template #body>
                <Button icon="pi pi-eye" class="p-button-text p-button-rounded p-button-sm" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Activity Feed -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Aktivitas Terbaru</h2>
            <Button icon="pi pi-ellipsis-h" class="p-button-text p-button-rounded" />
          </div>
        </template>
        <template #content>
          <Timeline :value="recentActivities" class="p-0">
            <template #content="slotProps">
              <div class="flex items-start mb-3">
                <Avatar :icon="slotProps.item.icon" :style="{ backgroundColor: slotProps.item.color }" shape="circle" class="flex-shrink-0 mr-3" />
                <div>
                  <p class="m-0 font-medium">{{ slotProps.item.title }}</p>
                  <p class="m-0 text-sm text-gray-500">{{ slotProps.item.description }}</p>
                  <small class="text-gray-400">{{ slotProps.item.time }}</small>
                </div>
              </div>
            </template>
          </Timeline>
        </template>
      </Card>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Penjualan Bulanan</h2>
            <Dropdown v-model="selectedYear" :options="years" optionLabel="name" placeholder="Tahun" class="w-32 p-dropdown-sm" />
          </div>
        </template>
        <template #content>
          <div class="h-72">
            <!-- Chart will be rendered here with a chart library -->
            <div class="flex items-center justify-center h-full text-gray-400">
              <i class="text-6xl pi pi-chart-bar"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Kategori Produk</h2>
            <Dropdown v-model="selectedPeriod" :options="periods" optionLabel="name" placeholder="Periode" class="w-32 p-dropdown-sm" />
          </div>
        </template>
        <template #content>
          <div class="h-72">
            <!-- Chart will be rendered here with a chart library -->
            <div class="flex items-center justify-center h-full text-gray-400">
              <i class="text-6xl pi pi-chart-pie"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref } from "vue";
import DashboardLayout from "@/layouts/dashboardLayout/DashboardLayout.vue";
import Card from "primevue/card";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Timeline from "primevue/timeline";
import Dropdown from "primevue/dropdown";
import Avatar from "primevue/avatar";
import Tag from "primevue/tag";

// Sample data for recent transactions
const recentTransactions = ref([
  { id: "TRX-001", customer: "Ahmad Fauzi", avatar: "https://i.pravatar.cc/150?img=1", date: "2024-10-15", amount: "Rp 2.500.000", status: "Completed" },
  { id: "TRX-002", customer: "Siti Nurhaliza", avatar: "https://i.pravatar.cc/150?img=5", date: "2024-10-14", amount: "Rp 1.800.000", status: "Processing" },
  { id: "TRX-003", customer: "Budi Santoso", avatar: "https://i.pravatar.cc/150?img=3", date: "2024-10-14", amount: "Rp 3.200.000", status: "Completed" },
  { id: "TRX-004", customer: "Rini Kartika", avatar: "https://i.pravatar.cc/150?img=8", date: "2024-10-13", amount: "Rp 900.000", status: "Cancelled" },
  { id: "TRX-005", customer: "Joko Widodo", avatar: "https://i.pravatar.cc/150?img=4", date: "2024-10-12", amount: "Rp 1.250.000", status: "Completed" },
]);

// Sample data for recent activities
const recentActivities = ref([
  {
    title: "Produk baru ditambahkan",
    description: 'Admin menambahkan produk "Parfum Exotic Bloom"',
    time: "10 menit yang lalu",
    icon: "pi pi-box",
    color: "#689F38",
  },
  {
    title: "Transaksi baru",
    description: "Siti Nurhaliza melakukan pembelian senilai Rp 1.800.000",
    time: "1 jam yang lalu",
    icon: "pi pi-shopping-cart",
    color: "#FBC02D",
  },
  {
    title: "Pengguna baru",
    description: "Dian Sastro mendaftar sebagai pelanggan baru",
    time: "3 jam yang lalu",
    icon: "pi pi-user-plus",
    color: "#7E57C2",
  },
  {
    title: "Stok produk menipis",
    description: 'Parfum "Midnight Dreams" tersisa 5 unit',
    time: "5 jam yang lalu",
    icon: "pi pi-exclamation-triangle",
    color: "#EF5350",
  },
]);

// Dropdown options
const selectedYear = ref({ name: "2024", code: "2024" });
const years = ref([
  { name: "2022", code: "2022" },
  { name: "2023", code: "2023" },
  { name: "2024", code: "2024" },
]);

const selectedPeriod = ref({ name: "Bulan Ini", code: "this_month" });
const periods = ref([
  { name: "Minggu Ini", code: "this_week" },
  { name: "Bulan Ini", code: "this_month" },
  { name: "Tahun Ini", code: "this_year" },
]);

// Helper functions
const getStatusSeverity = (status) => {
  switch (status) {
    case "Completed":
      return "success";
    case "Processing":
      return "info";
    case "Cancelled":
      return "danger";
    default:
      return "warning";
  }
};
</script>
