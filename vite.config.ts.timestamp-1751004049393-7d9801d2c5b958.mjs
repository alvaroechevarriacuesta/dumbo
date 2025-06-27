// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { crx } from "file:///home/project/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// src/manifest.ts
import { defineManifest } from "file:///home/project/node_modules/@crxjs/vite-plugin/dist/index.mjs";
var manifest_default = defineManifest({
  manifest_version: 3,
  name: "Extendo Dumbo",
  version: "1.0",
  description: "A simple side panel extension",
  permissions: [
    "sidePanel",
    "commands",
    "tabs",
    "windows",
    "storage",
    "storage.local"
  ],
  host_permissions: [
    "https://*.supabase.co/*"
  ],
  action: {
    default_title: "Toggle Side Panel"
  },
  side_panel: {
    default_path: "side-panel.html"
  },
  background: {
    service_worker: "src/background.ts"
  },
  commands: {
    "toggle-side-panel": {
      suggested_key: {
        default: "Ctrl+K",
        mac: "Command+K"
      },
      description: "Toggle the side panel"
    },
    "save-page": {
      suggested_key: {
        default: "Ctrl+J",
        mac: "Command+J"
      },
      description: "Save the current page"
    }
  }
});

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest_default })
  ],
  build: {
    rollupOptions: {
      input: {
        // Main app entry point
        main: "index.html",
        // Extension side panel entry point
        "side-panel": "side-panel.html"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL21hbmlmZXN0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbidcbmltcG9ydCBtYW5pZmVzdCBmcm9tICcuL3NyYy9tYW5pZmVzdCdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBjcngoeyBtYW5pZmVzdCB9KVxuICBdLFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIC8vIE1haW4gYXBwIGVudHJ5IHBvaW50XG4gICAgICAgIG1haW46ICdpbmRleC5odG1sJyxcbiAgICAgICAgLy8gRXh0ZW5zaW9uIHNpZGUgcGFuZWwgZW50cnkgcG9pbnRcbiAgICAgICAgJ3NpZGUtcGFuZWwnOiAnc2lkZS1wYW5lbC5odG1sJ1xuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc3JjL21hbmlmZXN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc3JjL21hbmlmZXN0LnRzXCI7aW1wb3J0IHsgZGVmaW5lTWFuaWZlc3QgfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVNYW5pZmVzdCh7XG4gIG1hbmlmZXN0X3ZlcnNpb246IDMsXG4gIG5hbWU6IFwiRXh0ZW5kbyBEdW1ib1wiLFxuICB2ZXJzaW9uOiBcIjEuMFwiLFxuICBkZXNjcmlwdGlvbjogXCJBIHNpbXBsZSBzaWRlIHBhbmVsIGV4dGVuc2lvblwiLFxuICBwZXJtaXNzaW9uczogW1xuICAgIFwic2lkZVBhbmVsXCIsXG4gICAgXCJjb21tYW5kc1wiLFxuICAgIFwidGFic1wiLFxuICAgIFwid2luZG93c1wiLFxuICAgIFwic3RvcmFnZVwiLFxuICAgIFwic3RvcmFnZS5sb2NhbFwiXG4gIF0sXG4gIGhvc3RfcGVybWlzc2lvbnM6IFtcbiAgICBcImh0dHBzOi8vKi5zdXBhYmFzZS5jby8qXCJcbiAgXSxcbiAgYWN0aW9uOiB7XG4gICAgZGVmYXVsdF90aXRsZTogXCJUb2dnbGUgU2lkZSBQYW5lbFwiXG4gIH0sXG4gIHNpZGVfcGFuZWw6IHtcbiAgICBkZWZhdWx0X3BhdGg6IFwic2lkZS1wYW5lbC5odG1sXCJcbiAgfSxcbiAgYmFja2dyb3VuZDoge1xuICAgIHNlcnZpY2Vfd29ya2VyOiBcInNyYy9iYWNrZ3JvdW5kLnRzXCIsXG4gIH0sXG4gIGNvbW1hbmRzOiB7XG4gICAgXCJ0b2dnbGUtc2lkZS1wYW5lbFwiOiB7XG4gICAgICBzdWdnZXN0ZWRfa2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFwiQ3RybCtLXCIsXG4gICAgICAgIG1hYzogXCJDb21tYW5kK0tcIlxuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlRvZ2dsZSB0aGUgc2lkZSBwYW5lbFwiXG4gICAgfSxcbiAgICBcInNhdmUtcGFnZVwiOiB7XG4gICAgICBzdWdnZXN0ZWRfa2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFwiQ3RybCtKXCIsXG4gICAgICAgIG1hYzogXCJDb21tYW5kK0pcIlxuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlNhdmUgdGhlIGN1cnJlbnQgcGFnZVwiXG4gICAgfVxuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixTQUFTLFdBQVc7OztBQ0YyTSxTQUFTLHNCQUFzQjtBQUU5UCxJQUFPLG1CQUFRLGVBQWU7QUFBQSxFQUM1QixrQkFBa0I7QUFBQSxFQUNsQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsRUFDVCxhQUFhO0FBQUEsRUFDYixhQUFhO0FBQUEsSUFDWDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0Esa0JBQWtCO0FBQUEsSUFDaEI7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixlQUFlO0FBQUEsRUFDakI7QUFBQSxFQUNBLFlBQVk7QUFBQSxJQUNWLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsWUFBWTtBQUFBLElBQ1YsZ0JBQWdCO0FBQUEsRUFDbEI7QUFBQSxFQUNBLFVBQVU7QUFBQSxJQUNSLHFCQUFxQjtBQUFBLE1BQ25CLGVBQWU7QUFBQSxRQUNiLFNBQVM7QUFBQSxRQUNULEtBQUs7QUFBQSxNQUNQO0FBQUEsTUFDQSxhQUFhO0FBQUEsSUFDZjtBQUFBLElBQ0EsYUFBYTtBQUFBLE1BQ1gsZUFBZTtBQUFBLFFBQ2IsU0FBUztBQUFBLFFBQ1QsS0FBSztBQUFBLE1BQ1A7QUFBQSxNQUNBLGFBQWE7QUFBQSxJQUNmO0FBQUEsRUFDRjtBQUNGLENBQUM7OztBRHJDRCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixJQUFJLEVBQUUsMkJBQVMsQ0FBQztBQUFBLEVBQ2xCO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUE7QUFBQSxRQUVMLE1BQU07QUFBQTtBQUFBLFFBRU4sY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
