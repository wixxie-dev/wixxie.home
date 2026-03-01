import type { PredefinedApp } from "../types";

const iconBase = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png";

export const predefinedApps: PredefinedApp[] = [
  { id: "immich", name: "Immich", icon: `${iconBase}/immich.png`, configFields: [{ key: "apiKey", label: "API Key" }] },
  {
    id: "portainer",
    name: "Portainer",
    icon: `${iconBase}/portainer.png`,
    configFields: [{ key: "token", label: "Access Token" }],
  },
  {
    id: "home_assistant",
    name: "Home Assistant",
    icon: `${iconBase}/home-assistant.png`,
    configFields: [{ key: "token", label: "Long-lived Access Token" }],
  },
  { id: "sonarr", name: "Sonarr", icon: `${iconBase}/sonarr.png`, configFields: [{ key: "apiKey", label: "API Key" }] },
  { id: "radarr", name: "Radarr", icon: `${iconBase}/radarr.png`, configFields: [{ key: "apiKey", label: "API Key" }] },
  {
    id: "uptime_kuma",
    name: "Uptime Kuma",
    icon: `${iconBase}/uptime-kuma.png`,
    configFields: [
      {
        key: "apiKey",
        label: "API Key",
        optional: true,
        placeholder: "Optional: username:password or API key (for /metrics to see all 4 monitors)",
      },
    ],
  },
  { id: "jellyfin", name: "Jellyfin", icon: `${iconBase}/jellyfin.png`, configFields: [{ key: "apiKey", label: "API Key" }] },
  { id: "sabnzbd", name: "SABnzbd", icon: `${iconBase}/sabnzbd.png`, configFields: [{ key: "apiKey", label: "API Key" }] },
];
