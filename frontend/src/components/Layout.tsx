import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Plus, Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { api } from "../lib/api";
import { WebSearchBar } from "./WebSearchBar";
import type { SearchEngine } from "../types";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
};

export function Layout({ title }: Props) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const isDashboard = pathname === "/";
  const [searchEngine, setSearchEngine] = useState<SearchEngine>("duckduckgo");
  const { setTheme } = useTheme();

  useEffect(() => {
    api
      .getSettings()
      .then((settings) => {
        setSearchEngine(settings.searchEngine);
        setTheme(settings.theme);
      })
      .catch(() => {});
  }, [setTheme]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3">
          <Link
            to="/"
            className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 bg-clip-text text-lg font-bold tracking-tight text-transparent"
          >
            {title}
          </Link>

          <div className="hidden justify-center md:flex">
            {isDashboard && (
              <div className="w-full max-w-xl">
                <WebSearchBar searchEngine={searchEngine} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            {isDashboard && (
              <Button
                type="button"
                className="rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 hover:bg-violet-500"
                onClick={() => window.dispatchEvent(new Event("wixxie:add-service"))}
              >
                <Plus className="h-4 w-4" />
                Add service
              </Button>
            )}
            <ThemeToggle
              onThemeChange={(theme) => {
                api.updateSettings({ theme }).catch(() => {});
              }}
            />
            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-xl border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-violet-500 dark:hover:text-violet-300"
              title="Settings"
            >
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            {user && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-zinc-200 bg-white/80 shadow-sm transition hover:border-red-300 hover:text-red-500 dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-red-500/60 dark:hover:text-red-300"
                onClick={logout}
              >
                Log out
              </Button>
            )}
          </div>

          {isDashboard && (
            <div className="col-span-3 md:hidden">
              <WebSearchBar searchEngine={searchEngine} />
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
