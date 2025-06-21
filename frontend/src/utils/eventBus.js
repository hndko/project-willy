// A simple event bus for Vue 3 to communicate between components
// that are not directly related in the component hierarchy

import { reactive } from "vue";

export const eventBus = reactive({
  // Define events
  events: {},

  // Emit an event with optional data
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => {
        callback(...args);
      });
    }
  },

  // Register a callback for an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },

  // Remove a callback for an event
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
  },
});
