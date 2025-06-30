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
    "storage",
    "storage.local",
    "activeTab",
    "scripting"
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
    service_worker: "src/background.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content-script.ts"],
      run_at: "document_end"
    }
  ],
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
      description: "Show contexts popup"
    }
  },
  web_accessible_resources: [
    {
      resources: ["popup.html"],
      matches: ["<all_urls>"]
    }
  ]
});

// vite.config.ts
var vite_config_default = defineConfig(({ mode }) => {
  const isExtensionV2 = mode === "extension-v2";
  return {
    plugins: [
      react(),
      crx({ manifest: manifest_default })
    ],
    server: {
      hmr: {
        protocol: "wss",
        host: "localhost",
        clientPort: 5173
      }
    },
    build: {
      rollupOptions: {
        input: isExtensionV2 ? {
          "side-panel": "side-panel-v2.html"
        } : {
          // Main app entry point
          main: "index.html",
          // Extension side panel entry point
          "side-panel": "side-panel-v2.html",
          // Extension popup entry point
          "popup": "popup.html"
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL21hbmlmZXN0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbidcbmltcG9ydCBtYW5pZmVzdCBmcm9tICcuL3NyYy9tYW5pZmVzdCdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGlzRXh0ZW5zaW9uVjIgPSBtb2RlID09PSAnZXh0ZW5zaW9uLXYyJztcbiAgXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIGNyeCh7IG1hbmlmZXN0IH0pXG4gICAgXSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhtcjoge1xuICAgICAgICBwcm90b2NvbDogJ3dzcycsXG4gICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICBjbGllbnRQb3J0OiA1MTczXG4gICAgICB9XG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBpbnB1dDogaXNFeHRlbnNpb25WMiA/IHtcbiAgICAgICAgICAnc2lkZS1wYW5lbCc6ICdzaWRlLXBhbmVsLXYyLmh0bWwnXG4gICAgICAgIH0gOiB7XG4gICAgICAgICAgLy8gTWFpbiBhcHAgZW50cnkgcG9pbnRcbiAgICAgICAgICBtYWluOiAnaW5kZXguaHRtbCcsXG4gICAgICAgICAgLy8gRXh0ZW5zaW9uIHNpZGUgcGFuZWwgZW50cnkgcG9pbnRcbiAgICAgICAgICAnc2lkZS1wYW5lbCc6ICdzaWRlLXBhbmVsLXYyLmh0bWwnLFxuICAgICAgICAgIC8vIEV4dGVuc2lvbiBwb3B1cCBlbnRyeSBwb2ludFxuICAgICAgICAgICdwb3B1cCc6ICdwb3B1cC5odG1sJ1xuICAgICAgICB9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NyYy9tYW5pZmVzdC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NyYy9tYW5pZmVzdC50c1wiO2ltcG9ydCB7IGRlZmluZU1hbmlmZXN0IH0gZnJvbSAnQGNyeGpzL3ZpdGUtcGx1Z2luJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lTWFuaWZlc3Qoe1xuICBtYW5pZmVzdF92ZXJzaW9uOiAzLFxuICBuYW1lOiBcIkV4dGVuZG8gRHVtYm9cIixcbiAgdmVyc2lvbjogXCIxLjBcIixcbiAgZGVzY3JpcHRpb246IFwiQSBzaW1wbGUgc2lkZSBwYW5lbCBleHRlbnNpb25cIixcbiAgcGVybWlzc2lvbnM6IFtcbiAgICBcInNpZGVQYW5lbFwiLFxuICAgIFwiY29tbWFuZHNcIixcbiAgICBcInRhYnNcIixcbiAgICBcInN0b3JhZ2VcIixcbiAgICBcInN0b3JhZ2UubG9jYWxcIixcbiAgICBcImFjdGl2ZVRhYlwiLFxuICAgIFwic2NyaXB0aW5nXCJcbiAgXSxcbiAgaG9zdF9wZXJtaXNzaW9uczogW1xuICAgIFwiaHR0cHM6Ly8qLnN1cGFiYXNlLmNvLypcIlxuICBdLFxuICBhY3Rpb246IHtcbiAgICBkZWZhdWx0X3RpdGxlOiBcIlRvZ2dsZSBTaWRlIFBhbmVsXCJcbiAgfSxcbiAgc2lkZV9wYW5lbDoge1xuICAgIGRlZmF1bHRfcGF0aDogXCJzaWRlLXBhbmVsLmh0bWxcIlxuICB9LFxuICBiYWNrZ3JvdW5kOiB7XG4gICAgc2VydmljZV93b3JrZXI6IFwic3JjL2JhY2tncm91bmQudHNcIixcbiAgICB0eXBlOiBcIm1vZHVsZVwiXG4gIH0sXG4gIGNvbnRlbnRfc2NyaXB0czogW1xuICAgIHtcbiAgICAgIG1hdGNoZXM6IFtcIjxhbGxfdXJscz5cIl0sXG4gICAgICBqczogW1wic3JjL2NvbnRlbnQtc2NyaXB0LnRzXCJdLFxuICAgICAgcnVuX2F0OiBcImRvY3VtZW50X2VuZFwiXG4gICAgfVxuICBdLFxuICBjb21tYW5kczoge1xuICAgIFwidG9nZ2xlLXNpZGUtcGFuZWxcIjoge1xuICAgICAgc3VnZ2VzdGVkX2tleToge1xuICAgICAgICBkZWZhdWx0OiBcIkN0cmwrS1wiLFxuICAgICAgICBtYWM6IFwiQ29tbWFuZCtLXCJcbiAgICAgIH0sXG4gICAgICBkZXNjcmlwdGlvbjogXCJUb2dnbGUgdGhlIHNpZGUgcGFuZWxcIlxuICAgIH0sXG4gICAgXCJzYXZlLXBhZ2VcIjoge1xuICAgICAgc3VnZ2VzdGVkX2tleToge1xuICAgICAgICBkZWZhdWx0OiBcIkN0cmwrSlwiLFxuICAgICAgICBtYWM6IFwiQ29tbWFuZCtKXCJcbiAgICAgIH0sXG4gICAgICBkZXNjcmlwdGlvbjogXCJTaG93IGNvbnRleHRzIHBvcHVwXCJcbiAgICB9XG4gIH0sXG4gIHdlYl9hY2Nlc3NpYmxlX3Jlc291cmNlczogW1xuICAgIHtcbiAgICAgIHJlc291cmNlczogW1wicG9wdXAuaHRtbFwiXSxcbiAgICAgIG1hdGNoZXM6IFtcIjxhbGxfdXJscz5cIl1cbiAgICB9XG4gIF1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsV0FBVzs7O0FDRjJNLFNBQVMsc0JBQXNCO0FBRTlQLElBQU8sbUJBQVEsZUFBZTtBQUFBLEVBQzVCLGtCQUFrQjtBQUFBLEVBQ2xCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxFQUNULGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFBQSxJQUNYO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0Esa0JBQWtCO0FBQUEsSUFDaEI7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixlQUFlO0FBQUEsRUFDakI7QUFBQSxFQUNBLFlBQVk7QUFBQSxJQUNWLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsWUFBWTtBQUFBLElBQ1YsZ0JBQWdCO0FBQUEsSUFDaEIsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLGlCQUFpQjtBQUFBLElBQ2Y7QUFBQSxNQUNFLFNBQVMsQ0FBQyxZQUFZO0FBQUEsTUFDdEIsSUFBSSxDQUFDLHVCQUF1QjtBQUFBLE1BQzVCLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsVUFBVTtBQUFBLElBQ1IscUJBQXFCO0FBQUEsTUFDbkIsZUFBZTtBQUFBLFFBQ2IsU0FBUztBQUFBLFFBQ1QsS0FBSztBQUFBLE1BQ1A7QUFBQSxNQUNBLGFBQWE7QUFBQSxJQUNmO0FBQUEsSUFDQSxhQUFhO0FBQUEsTUFDWCxlQUFlO0FBQUEsUUFDYixTQUFTO0FBQUEsUUFDVCxLQUFLO0FBQUEsTUFDUDtBQUFBLE1BQ0EsYUFBYTtBQUFBLElBQ2Y7QUFBQSxFQUNGO0FBQUEsRUFDQSwwQkFBMEI7QUFBQSxJQUN4QjtBQUFBLE1BQ0UsV0FBVyxDQUFDLFlBQVk7QUFBQSxNQUN4QixTQUFTLENBQUMsWUFBWTtBQUFBLElBQ3hCO0FBQUEsRUFDRjtBQUNGLENBQUM7OztBRHBERCxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLGdCQUFnQixTQUFTO0FBRS9CLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLElBQUksRUFBRSwyQkFBUyxDQUFDO0FBQUEsSUFDbEI7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNILFVBQVU7QUFBQSxRQUNWLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxNQUNkO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsZUFBZTtBQUFBLFFBQ2IsT0FBTyxnQkFBZ0I7QUFBQSxVQUNyQixjQUFjO0FBQUEsUUFDaEIsSUFBSTtBQUFBO0FBQUEsVUFFRixNQUFNO0FBQUE7QUFBQSxVQUVOLGNBQWM7QUFBQTtBQUFBLFVBRWQsU0FBUztBQUFBLFFBQ1g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
