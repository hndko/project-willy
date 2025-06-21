<template>
  <div class="p-4">
    <div v-if="loading" class="flex justify-center">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="5" fill="var(--surface-ground)" animationDuration=".5s" />
    </div>
    <div v-else-if="log" class="space-y-6">
      <!-- Header with buttons -->
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-bold">Activity Log Details</h3>
        <div class="flex gap-2">
          <Button icon="pi pi-times" label="Close" outlined severity="secondary" @click="$emit('close')" />
        </div>
      </div>

      <!-- Activity log information -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="col-span-1 md:col-span-2">
          <Card class="shadow-sm">
            <template #content>
              <div class="flex flex-col gap-6">
                <!-- User information -->
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-12 h-12 text-blue-600 bg-blue-100 rounded-full">
                    <i class="text-xl pi pi-user"></i>
                  </div>
                  <div>
                    <p class="font-medium">{{ log.User?.name || "Unknown User" }}</p>
                    <p class="text-sm text-gray-500">{{ log.User?.email || "No email" }}</p>
                  </div>
                </div>

                <!-- Activity details -->
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div class="space-y-1">
                    <p class="text-sm text-gray-500">Action</p>
                    <div>
                      <Tag :severity="getActionSeverity(log.action)" :value="log.action" />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <p class="text-sm text-gray-500">Table</p>
                    <Badge :value="log.table" class="text-sm" />
                  </div>

                  <div class="space-y-1">
                    <p class="text-sm text-gray-500">Created At</p>
                    <p class="font-medium">{{ formatDate(log.createdAt) }}</p>
                    <p class="text-xs text-gray-500">{{ formatTime(log.createdAt) }}</p>
                  </div>

                  <div class="space-y-1">
                    <p class="text-sm text-gray-500">Updated At</p>
                    <p class="font-medium">{{ formatDate(log.updatedAt) }}</p>
                    <p class="text-xs text-gray-500">{{ formatTime(log.updatedAt) }}</p>
                  </div>
                </div>

                <!-- Log description -->
                <div class="space-y-2">
                  <p class="text-sm text-gray-500">Description</p>
                  <div class="p-4 rounded-lg bg-gray-50">
                    <p class="whitespace-pre-line">{{ log.description }}</p>
                  </div>
                </div>

                <!-- Activity ID -->
                <div class="pt-2 border-t border-gray-200">
                  <p class="text-xs text-gray-500">Activity ID: {{ log.id }}</p>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
    <div v-else class="py-8 text-center">
      <i class="mb-4 text-4xl text-yellow-500 pi pi-exclamation-circle"></i>
      <p>Log not found or has been deleted.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Button from "primevue/button";
import ProgressSpinner from "primevue/progressspinner";
import { getActivityLogById } from "@/services/activityLogService";
import { format } from "date-fns";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const toast = useToast();
const log = ref(null);
const loading = ref(false);

const fetchLog = async () => {
  if (!props.id) return;

  try {
    loading.value = true;
    const response = await getActivityLogById(props.id);
    log.value = response.data;
  } catch (error) {
    console.error("Error fetching activity log:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal memuat detail log aktivitas",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    return dateString;
  }
};

const formatTime = (dateString) => {
  try {
    return format(new Date(dateString), "HH:mm:ss");
  } catch (error) {
    return "";
  }
};

const getActionSeverity = (action) => {
  switch (action?.toLowerCase()) {
    case "create":
      return "success";
    case "update":
      return "info";
    case "delete":
      return "danger";
    default:
      return "warning";
  }
};

onMounted(() => {
  fetchLog();
});

watch(
  () => props.id,
  (newId) => {
    if (newId) {
      fetchLog();
    }
  }
);
</script>
