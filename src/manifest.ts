import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
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