<template>
  <Card class="shadow-sm">
    <template #title>
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold">Recent Activity Timeline</span>
        <div class="flex items-center gap-2">
          <Button icon="pi pi-filter" :class="{ 'p-button-outlined p-button-info': !!timelineMonthFilter }" text rounded @click="$emit('toggle-filter')" />
          <Button icon="pi pi-sync" text rounded @click="$emit('refresh')" :loading="timelineLoading" />
        </div>
      </div>
    </template>
    <template #content>
      <div v-if="timelineLoading" class="flex justify-center py-4">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="5" />
      </div>
      <div v-else>
        <Timeline :value="timelineEvents" class="customized-timeline">
          <template #marker="slotProps">
            <span :class="getTimelineIconClass(slotProps.item.action)">
              <i :class="getActionIcon(slotProps.item.action)"></i>
            </span>
          </template>
          <template #content="slotProps">
            <div :class="getTimelineItemClass(slotProps.item.action)" class="p-4 mb-4 rounded-lg shadow-sm timeline-event-content">
              <div class="flex items-start">
                <div class="flex-grow">
                  <p class="m-0 font-medium">{{ slotProps.item.title }}</p>
                  <p class="mt-1 text-sm text-gray-600">{{ slotProps.item.description }}</p>
                  <div class="flex flex-wrap items-center gap-2 mt-2">
                    <Tag :value="slotProps.item.action" :severity="getActionSeverity(slotProps.item.action)" />
                    <Badge :value="slotProps.item.table" class="text-xs" />
                    <span class="text-xs text-gray-500">{{ slotProps.item.time }}</span>
                  </div>
                </div>
                <Button icon="pi pi-eye" text rounded severity="secondary" @click="$emit('view-details', slotProps.item.raw)" class="ml-2" />
              </div>
            </div>
          </template>
        </Timeline>

        <div v-if="timelineEvents.length === 0" class="py-4 text-center text-gray-500">No recent activity to display</div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Timeline from "primevue/timeline";
import ProgressSpinner from "primevue/progressspinner";
import { getActionSeverity, getActionRowClass, getActionIcon, getTimelineIconClass } from "@/utils/actionUtils";

const props = defineProps({
  timelineEvents: {
    type: Array,
    default: () => [],
  },
  timelineLoading: {
    type: Boolean,
    default: false,
  },
  timelineMonthFilter: {
    type: Date,
    default: null,
  },
  timelineFilterDialogVisible: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["toggle-filter", "apply-filter", "clear-filter", "refresh", "view-details"]);

// Use shared function with a different name for clarity
const getTimelineItemClass = getActionRowClass;

// Get timeline item icon based on action
const getTimelineIcon = (action) => {
  const actionLower = action?.toLowerCase() || "";

  if (actionLower.includes("create")) {
    return "pi pi-plus";
  } else if (actionLower.includes("update")) {
    return "pi pi-pencil";
  } else if (actionLower.includes("delete")) {
    return "pi pi-trash";
  }

  return "pi pi-info-circle";
};
</script>

<style scoped>
/* Timeline custom styling */
:deep(.customized-timeline) .p-timeline-event-content,
:deep(.customized-timeline) .p-timeline-event-opposite {
  line-height: 1.5;
}

:deep(.customized-timeline) .p-timeline-event-opposite {
  flex: 0;
  padding: 0 1rem;
}

:deep(.p-timeline-event) {
  margin-bottom: 0.5rem;
}

:deep(.p-timeline .p-timeline-event-marker) {
  border: 0;
}

:deep(.p-timeline .p-timeline-event-connector) {
  background-color: #e2e8f0;
}
</style>
