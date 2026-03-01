import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  selectedTags: string[];
  options: string[];
  onChange: (tags: string[]) => void;
};

export function FancyTagInput({ selectedTags, options, onChange }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const normalizedSelected = useMemo(
    () => new Set(selectedTags.map((t) => t.toLowerCase())),
    [selectedTags],
  );
  const suggestions = useMemo(
    () =>
      options
        .filter((tag) => !normalizedSelected.has(tag.toLowerCase()))
        .filter((tag) =>
          tag.toLowerCase().includes(input.trim().toLowerCase()),
        )
        .slice(0, 8),
    [options, normalizedSelected, input],
  );

  const addTag = useCallback(
    (rawTag: string) => {
      const tag = rawTag.trim();
      if (!tag) return;
      const lower = tag.toLowerCase();
      if (normalizedSelected.has(lower)) return;
      onChange([...selectedTags, lower]);
      setInput("");
      setHighlightIndex(0);
    },
    [normalizedSelected, selectedTags, onChange],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(selectedTags.filter((t) => t !== tag));
    },
    [selectedTags, onChange],
  );

  const showDropdown = open && (input.trim() !== "" || suggestions.length > 0);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIndex((i) =>
      suggestions.length === 0 ? 0 : Math.min(i, suggestions.length - 1),
    );
  }, [suggestions.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!showDropdown || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, showDropdown]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) {
      if (e.key === "Backspace" && !input && selectedTags.length > 0) {
        removeTag(selectedTags[selectedTags.length - 1]);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) =>
          i < suggestions.length - 1 ? i + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) =>
          i > 0 ? i - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
      case ",":
        e.preventDefault();
        if (suggestions[highlightIndex]) {
          addTag(suggestions[highlightIndex]);
        } else if (input.trim()) {
          addTag(input);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
      default:
        if (e.key === "Backspace" && !input && selectedTags.length > 0) {
          removeTag(selectedTags[selectedTags.length - 1]);
        }
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex min-h-11 flex-wrap items-center gap-2 rounded-2xl border border-input bg-background px-3 py-2 shadow-sm transition focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400/20 dark:border-zinc-600 dark:bg-zinc-900/50"
        onClick={() => setOpen(true)}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
          >
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="h-4 w-4 rounded-full p-0 hover:bg-violet-200/50 dark:hover:bg-violet-500/30"
            >
              <X className="h-3 w-3" />
            </Button>
          </span>
        ))}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="min-w-36 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
          placeholder={
            selectedTags.length === 0
              ? "Add or select tags..."
              : "Type to add tag"
          }
        />
      </div>

      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          aria-multiselectable
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {suggestions.length === 0 ? (
            <li
              role="option"
              className="px-3 py-2 text-sm text-muted-foreground"
            >
              No tags found. Type and press Enter to add.
            </li>
          ) : (
            suggestions.map((tag, i) => (
              <li
                key={tag}
                role="option"
                aria-selected={i === highlightIndex}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === highlightIndex
                    ? "bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-100"
                    : "text-foreground hover:bg-accent"
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={(e) => {
                  e.preventDefault();
                  addTag(tag);
                }}
              >
                {tag}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
