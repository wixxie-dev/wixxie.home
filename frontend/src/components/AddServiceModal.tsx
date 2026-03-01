import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { predefinedApps } from "@/lib/predefined-apps";
import type { Service } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PredefinedAppPicker } from "./PredefinedAppPicker";
import { FancyTagInput } from "./FancyTagInput";

type Props = {
  open: boolean;
  initial?: Service | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    url: string;
    icon: string | null;
    openInNewTab: boolean;
    appType: string | null;
    apiConfig: Record<string, string>;
    tags: string[];
    isPinned: boolean;
  }) => Promise<void>;
  availableTags: string[];
};

export function AddServiceModal({
  open,
  initial,
  onClose,
  onSubmit,
  availableTags,
}: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [appType, setAppType] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [apiConfig, setApiConfig] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const selectedApp = useMemo(
    () => predefinedApps.find((app) => app.id === appType),
    [appType],
  );

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setUrl(initial?.url ?? "");
    setIcon(initial?.icon ?? "");
    setOpenInNewTab(initial?.openInNewTab ?? true);
    setAppType(initial?.appType ?? null);
    setTags(initial?.tags ?? []);
    setIsPinned(initial?.isPinned ?? false);
    setApiConfig(initial?.apiConfig ?? {});
  }, [open, initial]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-h-[95vh] max-w-3xl overflow-y-auto sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit service" : "Add service"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PredefinedAppPicker
            selectedId={appType}
            onSelect={(id) => {
              setAppType(id);
              const selected = predefinedApps.find((app) => app.id === id);
              if (selected && !initial) {
                setName(selected.name);
                setIcon(selected.icon);
              }
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-url">URL</Label>
            <Input
              id="service-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestStatus("idle");
              }}
              required
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-icon">Icon URL</Label>
            <Input
              id="service-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <FancyTagInput
              selectedTags={tags}
              options={availableTags}
              onChange={setTags}
            />
          </div>

          <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <Label htmlFor="service-open-tab" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground dark:text-zinc-200">
              <Checkbox
                id="service-open-tab"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
              />
              Open in new tab
            </Label>
            <Label htmlFor="service-pin" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground dark:text-zinc-200">
              <Checkbox
                id="service-pin"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              Pin service
            </Label>
          </div>

          {selectedApp && selectedApp.configFields.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-border bg-card p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-zinc-400">
                Integration settings ({selectedApp.name})
              </p>
              {selectedApp.configFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`api-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`api-${field.key}`}
                    className="rounded-2xl"
                    value={apiConfig[field.key] ?? ""}
                    onChange={(e) => {
                      setApiConfig((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }));
                      setTestStatus("idle");
                    }}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={
                    !url.trim() ||
                    selectedApp.configFields.some(
                      (f) => !f.optional && !(apiConfig[f.key] ?? "").trim(),
                    ) ||
                    testStatus === "testing"
                  }
                  onClick={async () => {
                    setTestStatus("testing");
                    setTestMessage("");
                    try {
                      const result = await api.testConnection({
                        appType: selectedApp.id,
                        baseUrl: url.trim(),
                        apiConfig,
                      });
                      setTestStatus("success");
                      setTestMessage(
                        result.stats && Object.keys(result.stats).length > 0
                          ? `Connected. ${Object.entries(result.stats)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}`
                          : "Connection successful.",
                      );
                    } catch (err) {
                      setTestStatus("error");
                      setTestMessage(err instanceof Error ? err.message : "Connection failed.");
                    }
                  }}
                >
                  {testStatus === "testing" ? "Testing…" : "Test connection"}
                </Button>
                {testStatus === "success" && (
                  <span className="text-sm text-green-600 dark:text-green-400">{testMessage}</span>
                )}
                {testStatus === "error" && (
                  <span className="text-sm text-red-600 dark:text-red-400">{testMessage}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await onSubmit({
                name,
                url,
                icon: icon || null,
                openInNewTab,
                appType,
                apiConfig,
                tags,
                isPinned,
              });
              onClose();
            }}
            className="bg-violet-600 shadow-lg shadow-violet-500/25 hover:bg-violet-700"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
