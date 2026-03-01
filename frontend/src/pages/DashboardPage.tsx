import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Service } from "../types";
import { AddServiceModal } from "../components/AddServiceModal";
import { SearchFilterBar } from "../components/SearchFilterBar";
import { Dashboard } from "../components/Dashboard";
import { useTheme } from "../lib/theme";

export function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { setTheme } = useTheme();

  async function load() {
    const [serviceList, userSettings, tags] = await Promise.all([
      api.listServices(),
      api.getSettings(),
      api.listTags(),
    ]);
    setServices(serviceList);
    setTagOptions(tags.map((tag) => tag.name));
    setTheme(userSettings.theme);
    document.title = userSettings.siteTitle || "Wixxie Home";
    const favicon = userSettings.faviconPath;
    if (favicon) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    const handler = () => {
      setEditing(null);
      setIsModalOpen(true);
    };
    window.addEventListener("wixxie:add-service", handler);
    return () => window.removeEventListener("wixxie:add-service", handler);
  }, []);

  const filteredServices = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return services.filter((service) => {
      if (activeTag && !service.tags.includes(activeTag)) {
        return false;
      }
      if (searchLower && !service.name.toLowerCase().includes(searchLower)) {
        return false;
      }
      return true;
    });
  }, [services, activeTag, search]);

  const allTags = useMemo(
    () =>
      Array.from(
        new Set([...services.flatMap((service) => service.tags), ...tagOptions]),
      ).sort(),
    [services, tagOptions],
  );

  return (
    <div className="space-y-4">
      <SearchFilterBar
        allTags={allTags}
        activeTag={activeTag}
        onTagChange={setActiveTag}
        search={search}
        onSearchChange={setSearch}
      />

      <Dashboard
        services={filteredServices}
        onServicesOrderChange={async (nextServices) => {
          setServices((prev) => {
            const map = new Map(nextServices.map((item) => [item.id, item]));
            return prev.map((s) => map.get(s.id) ?? s);
          });
          const pinned = nextServices.filter((s) => s.isPinned).map((s) => s.id);
          const regular = nextServices.filter((s) => !s.isPinned).map((s) => s.id);
          await api.reorderServices({ pinned, regular });
          await load();
        }}
        onEdit={(service) => {
          setEditing(service);
          setIsModalOpen(true);
        }}
        onDelete={async (service) => {
          if (!confirm(`Delete ${service.name}?`)) {
            return;
          }
          await api.deleteService(service.id);
          await load();
        }}
        onTogglePinned={async (service) => {
          await api.updateService(service.id, { isPinned: !service.isPinned });
          await load();
        }}
        onRefresh={async (service) => {
          await api.refreshService(service.id);
          await load();
        }}
      />

      <AddServiceModal
        open={isModalOpen}
        initial={editing}
        availableTags={allTags}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (payload) => {
          if (editing) {
            await api.updateService(editing.id, payload);
          } else {
            await api.createService(payload);
          }
          await load();
        }}
      />
    </div>
  );
}
