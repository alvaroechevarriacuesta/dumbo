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
    base: "./",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL21hbmlmZXN0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbidcbmltcG9ydCBtYW5pZmVzdCBmcm9tICcuL3NyYy9tYW5pZmVzdCdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGlzRXh0ZW5zaW9uVjIgPSBtb2RlID09PSAnZXh0ZW5zaW9uLXYyJztcbiAgXG4gIHJldHVybiB7XG4gICAgYmFzZTogJy4vJyxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgY3J4KHsgbWFuaWZlc3QgfSlcbiAgICBdLFxuICAgIHNlcnZlcjoge1xuICAgICAgaG1yOiB7XG4gICAgICAgIHByb3RvY29sOiAnd3NzJyxcbiAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgIGNsaWVudFBvcnQ6IDUxNzNcbiAgICAgIH1cbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIGlucHV0OiBpc0V4dGVuc2lvblYyID8ge1xuICAgICAgICAgICdzaWRlLXBhbmVsJzogJ3NpZGUtcGFuZWwtdjIuaHRtbCdcbiAgICAgICAgfSA6IHtcbiAgICAgICAgICAvLyBNYWluIGFwcCBlbnRyeSBwb2ludFxuICAgICAgICAgIG1haW46ICdpbmRleC5odG1sJyxcbiAgICAgICAgICAvLyBFeHRlbnNpb24gc2lkZSBwYW5lbCBlbnRyeSBwb2ludFxuICAgICAgICAgICdzaWRlLXBhbmVsJzogJ3NpZGUtcGFuZWwtdjIuaHRtbCcsXG4gICAgICAgICAgLy8gRXh0ZW5zaW9uIHBvcHVwIGVudHJ5IHBvaW50XG4gICAgICAgICAgJ3BvcHVwJzogJ3BvcHVwLmh0bWwnXG4gICAgICAgIH0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc3JjL21hbmlmZXN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc3JjL21hbmlmZXN0LnRzXCI7aW1wb3J0IHsgZGVmaW5lTWFuaWZlc3QgfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVNYW5pZmVzdCh7XG4gIG1hbmlmZXN0X3ZlcnNpb246IDMsXG4gIG5hbWU6IFwiRXh0ZW5kbyBEdW1ib1wiLFxuICB2ZXJzaW9uOiBcIjEuMFwiLFxuICBkZXNjcmlwdGlvbjogXCJBIHNpbXBsZSBzaWRlIHBhbmVsIGV4dGVuc2lvblwiLFxuICBwZXJtaXNzaW9uczogW1xuICAgIFwic2lkZVBhbmVsXCIsXG4gICAgXCJjb21tYW5kc1wiLFxuICAgIFwidGFic1wiLFxuICAgIFwic3RvcmFnZVwiLFxuICAgIFwic3RvcmFnZS5sb2NhbFwiLFxuICAgIFwiYWN0aXZlVGFiXCIsXG4gICAgXCJzY3JpcHRpbmdcIlxuICBdLFxuICBob3N0X3Blcm1pc3Npb25zOiBbXG4gICAgXCJodHRwczovLyouc3VwYWJhc2UuY28vKlwiXG4gIF0sXG4gIGFjdGlvbjoge1xuICAgIGRlZmF1bHRfdGl0bGU6IFwiVG9nZ2xlIFNpZGUgUGFuZWxcIlxuICB9LFxuICBzaWRlX3BhbmVsOiB7XG4gICAgZGVmYXVsdF9wYXRoOiBcInNpZGUtcGFuZWwuaHRtbFwiXG4gIH0sXG4gIGJhY2tncm91bmQ6IHtcbiAgICBzZXJ2aWNlX3dvcmtlcjogXCJzcmMvYmFja2dyb3VuZC50c1wiLFxuICAgIHR5cGU6IFwibW9kdWxlXCJcbiAgfSxcbiAgY29udGVudF9zY3JpcHRzOiBbXG4gICAge1xuICAgICAgbWF0Y2hlczogW1wiPGFsbF91cmxzPlwiXSxcbiAgICAgIGpzOiBbXCJzcmMvY29udGVudC1zY3JpcHQudHNcIl0sXG4gICAgICBydW5fYXQ6IFwiZG9jdW1lbnRfZW5kXCJcbiAgICB9XG4gIF0sXG4gIGNvbW1hbmRzOiB7XG4gICAgXCJ0b2dnbGUtc2lkZS1wYW5lbFwiOiB7XG4gICAgICBzdWdnZXN0ZWRfa2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFwiQ3RybCtLXCIsXG4gICAgICAgIG1hYzogXCJDb21tYW5kK0tcIlxuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlRvZ2dsZSB0aGUgc2lkZSBwYW5lbFwiXG4gICAgfSxcbiAgICBcInNhdmUtcGFnZVwiOiB7XG4gICAgICBzdWdnZXN0ZWRfa2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFwiQ3RybCtKXCIsXG4gICAgICAgIG1hYzogXCJDb21tYW5kK0pcIlxuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3cgY29udGV4dHMgcG9wdXBcIlxuICAgIH1cbiAgfSxcbiAgd2ViX2FjY2Vzc2libGVfcmVzb3VyY2VzOiBbXG4gICAge1xuICAgICAgcmVzb3VyY2VzOiBbXCJwb3B1cC5odG1sXCJdLFxuICAgICAgbWF0Y2hlczogW1wiPGFsbF91cmxzPlwiXVxuICAgIH1cbiAgXVxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxXQUFXOzs7QUNGMk0sU0FBUyxzQkFBc0I7QUFFOVAsSUFBTyxtQkFBUSxlQUFlO0FBQUEsRUFDNUIsa0JBQWtCO0FBQUEsRUFDbEIsTUFBTTtBQUFBLEVBQ04sU0FBUztBQUFBLEVBQ1QsYUFBYTtBQUFBLEVBQ2IsYUFBYTtBQUFBLElBQ1g7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFDQSxrQkFBa0I7QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLGVBQWU7QUFBQSxFQUNqQjtBQUFBLEVBQ0EsWUFBWTtBQUFBLElBQ1YsY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQSxZQUFZO0FBQUEsSUFDVixnQkFBZ0I7QUFBQSxJQUNoQixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsaUJBQWlCO0FBQUEsSUFDZjtBQUFBLE1BQ0UsU0FBUyxDQUFDLFlBQVk7QUFBQSxNQUN0QixJQUFJLENBQUMsdUJBQXVCO0FBQUEsTUFDNUIsUUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxVQUFVO0FBQUEsSUFDUixxQkFBcUI7QUFBQSxNQUNuQixlQUFlO0FBQUEsUUFDYixTQUFTO0FBQUEsUUFDVCxLQUFLO0FBQUEsTUFDUDtBQUFBLE1BQ0EsYUFBYTtBQUFBLElBQ2Y7QUFBQSxJQUNBLGFBQWE7QUFBQSxNQUNYLGVBQWU7QUFBQSxRQUNiLFNBQVM7QUFBQSxRQUNULEtBQUs7QUFBQSxNQUNQO0FBQUEsTUFDQSxhQUFhO0FBQUEsSUFDZjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLDBCQUEwQjtBQUFBLElBQ3hCO0FBQUEsTUFDRSxXQUFXLENBQUMsWUFBWTtBQUFBLE1BQ3hCLFNBQVMsQ0FBQyxZQUFZO0FBQUEsSUFDeEI7QUFBQSxFQUNGO0FBQ0YsQ0FBQzs7O0FEcERELElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sZ0JBQWdCLFNBQVM7QUFFL0IsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sSUFBSSxFQUFFLDJCQUFTLENBQUM7QUFBQSxJQUNsQjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sS0FBSztBQUFBLFFBQ0gsVUFBVTtBQUFBLFFBQ1YsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxlQUFlO0FBQUEsUUFDYixPQUFPLGdCQUFnQjtBQUFBLFVBQ3JCLGNBQWM7QUFBQSxRQUNoQixJQUFJO0FBQUE7QUFBQSxVQUVGLE1BQU07QUFBQTtBQUFBLFVBRU4sY0FBYztBQUFBO0FBQUEsVUFFZCxTQUFTO0FBQUEsUUFDWDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
