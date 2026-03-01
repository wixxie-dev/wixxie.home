export type ThemeOption = "dark" | "light" | "system";
export type SearchEngine = "duckduckgo" | "google" | "bing" | "startpage";

export type User = {
  id: number;
  username: string;
  displayName: string;
};

export type Service = {
  id: number;
  name: string;
  url: string;
  icon: string | null;
  openInNewTab: boolean;
  appType: string | null;
  apiConfig: Record<string, string>;
  isPinned: boolean;
  sortOrder: number;
  pinnedSortOrder: number;
  tags: string[];
  stats: Record<string, string | number> | null;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  theme: ThemeOption;
  searchEngine: SearchEngine;
  siteTitle: string;
  faviconPath: string | null;
};

export type PredefinedApp = {
  id: string;
  name: string;
  icon: string;
  configFields: Array<{ key: string; label: string; placeholder?: string; optional?: boolean }>;
};
