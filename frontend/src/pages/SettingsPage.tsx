import { useEffect, useState } from "react";
import type { SearchEngine, Settings, ThemeOption } from "../types";
import { api } from "../lib/api";
import { useTheme } from "../lib/theme";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const searchEngines: SearchEngine[] = ["duckduckgo", "google", "bing", "startpage"];

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    theme: "system",
    searchEngine: "duckduckgo",
    siteTitle: "Wixxie Home",
    faviconPath: null,
  });
  const [status, setStatus] = useState("");
  const { setTheme } = useTheme();

  useEffect(() => {
    api
      .getSettings()
      .then((result) => {
        setSettings(result);
        setTheme(result.theme);
      })
      .catch(console.error);
  }, [setTheme]);

  async function persist(next: Partial<Settings>) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    await api.updateSettings(next);
    setStatus("Saved");
    setTimeout(() => setStatus(""), 1200);
    if (next.theme) {
      setTheme(next.theme);
    }
    if (next.siteTitle) {
      document.title = next.siteTitle;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        {status && <p className="text-sm text-emerald-600">{status}</p>}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="space-y-2 p-4">
          <Label htmlFor="theme">Theme</Label>
          <Select
            id="theme"
            value={settings.theme}
            onChange={(e) => persist({ theme: e.target.value as ThemeOption })}
          >
            <option value="system">System</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-2 p-4">
          <Label htmlFor="search-engine">Default web search engine</Label>
          <Select
            id="search-engine"
            value={settings.searchEngine}
            onChange={(e) => persist({ searchEngine: e.target.value as SearchEngine })}
          >
            {searchEngines.map((engine) => (
              <option key={engine} value={engine}>
                {engine}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-2 p-4">
          <Label htmlFor="site-title">Site title (browser tab)</Label>
          <Input
            id="site-title"
            value={settings.siteTitle}
            onChange={(e) => setSettings((prev) => ({ ...prev, siteTitle: e.target.value }))}
            onBlur={() => persist({ siteTitle: settings.siteTitle })}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-2 p-4">
          <Label htmlFor="favicon">Upload favicon</Label>
          <Input
            id="favicon"
            type="file"
            accept="image/*,.ico"
            className="pt-1 file:mr-3 file:rounded-xl file:border file:border-input file:px-3 file:py-1 file:text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) {
                return;
              }
              const result = await api.uploadFavicon(file);
              setSettings((prev) => ({ ...prev, faviconPath: result.faviconPath }));
              setStatus("Favicon uploaded");
              setTimeout(() => setStatus(""), 1500);
            }}
          />
        {settings.faviconPath && (
          <img src={settings.faviconPath} alt="Favicon preview" className="mt-3 h-8 w-8 rounded" />
        )}
        </CardContent>
      </Card>
    </div>
  );
}
