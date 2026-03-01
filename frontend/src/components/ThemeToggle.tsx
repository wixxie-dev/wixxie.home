import { Monitor, Moon, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { useTheme } from "../lib/theme";
import type { ThemeOption } from "../types";
import { Button } from "@/components/ui/button";

const themeItems: Array<{
  id: ThemeOption;
  label: string;
  icon: typeof Sun;
}> = [
  { id: "system", label: "System", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
];

export function ThemeToggle({ onThemeChange }: { onThemeChange?: (theme: ThemeOption) => void }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const activeItem = useMemo(
    () => themeItems.find((item) => item.id === theme) ?? themeItems[0],
    [theme],
  );
  const ActiveIcon = activeItem.icon;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen((value) => !value)}
        title={`Theme: ${activeItem.label}`}
        aria-label={`Theme: ${activeItem.label}. Click to change.`}
        className="rounded-xl border-zinc-200 bg-white/80 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-violet-500 dark:hover:text-violet-300"
      >
        <ActiveIcon className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-40 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/95">
          {themeItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === theme;
            return (
              <Button
                type="button"
                key={item.id}
                variant="ghost"
                className={`w-full justify-start rounded-xl px-3 py-2 text-sm ${
                  isActive
                    ? "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/20"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                onClick={() => {
                  setTheme(item.id);
                  onThemeChange?.(item.id);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
