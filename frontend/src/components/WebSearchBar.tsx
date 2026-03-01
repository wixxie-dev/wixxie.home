import { Search } from "lucide-react";
import type { SearchEngine } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function buildSearchUrl(engine: SearchEngine, query: string) {
  const q = encodeURIComponent(query);
  switch (engine) {
    case "google":
      return `https://www.google.com/search?q=${q}`;
    case "bing":
      return `https://www.bing.com/search?q=${q}`;
    case "startpage":
      return `https://www.startpage.com/search?q=${q}`;
    case "duckduckgo":
    default:
      return `https://duckduckgo.com/?q=${q}`;
  }
}

export function WebSearchBar({ searchEngine }: { searchEngine: SearchEngine }) {
  return (
    <Card className="rounded-2xl border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <CardContent className="p-2">
        <form
          className="flex w-full items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.elements.namedItem("web-search") as HTMLInputElement | null;
            const query = input?.value.trim();
            if (!query) {
              return;
            }
            window.open(buildSearchUrl(searchEngine, query), "_blank", "noopener,noreferrer");
          }}
        >
          <Search className="h-4 w-4 text-violet-500" />
          <Input
            name="web-search"
            placeholder="Search the web..."
            className="h-8 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
          />
          <span className="rounded-xl bg-violet-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
            {searchEngine}
          </span>
        </form>
      </CardContent>
    </Card>
  );
}
