import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./routes";
import "./assets/tailwind.css";
import PrimeVue from "primevue/config";
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

// Initialize API interceptor
import "./utils/apiInterceptor";

//Component Style
import "primeicons/primeicons.css";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import Tooltip from "primevue/tooltip";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

//Style
const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{zinc.50}",
      100: "{zinc.100}",
      200: "{zinc.200}",
      300: "{zinc.300}",
      400: "{zinc.400}",
      500: "{zinc.500}",
      600: "{zinc.600}",
      700: "{zinc.700}",
      800: "{zinc.800}",
      900: "{zinc.900}",
      950: "{zinc.950}",
    },
    colorScheme: {
      light: {
        primary: {
          color: "{zinc.950}",
          inverseColor: "#ffffff",
          hoverColor: "{zinc.800}",
          activeColor: "{zinc.700}",
        },
        highlight: {
          background: "{zinc.900}",
          focusBackground: "{zinc.700}",
          color: "#ffffff",
          focusColor: "#ffffff",
        },
        formField: {
          hoverBorderColor: "{primary.color}",
        },
      },
      dark: {
        primary: {
          color: "{zinc.50}",
          inverseColor: "{zinc.950}",
          hoverColor: "{zinc.100}",
          activeColor: "{zinc.200}",
        },
        highlight: {
          background: "rgba(250, 250, 250, .16)",
          focusBackground: "rgba(250, 250, 250, .24)",
          color: "rgba(255,255,255,.87)",
          focusColor: "rgba(255,255,255,.87)",
        },
        formField: {
          hoverBorderColor: "{primary.color}",
        },
      },
    },
    focusRing: {
      width: "2px",
      style: "dashed",
      color: "{primary.color}",
      offset: "1px",
    },
  },
});

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      cssLayer: {
        name: "primevue",
        order: "theme, base, primevue",
      },
      darkModeSelector: "none",
    },
  },
});

app.use(ToastService);
app.use(ConfirmationService);
// Register tooltip directive
app.directive("tooltip", Tooltip);

app.mount("#app");
