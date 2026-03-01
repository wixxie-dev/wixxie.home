import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, PenSquare, Pin, RefreshCw, Trash2 } from "lucide-react";
import type { Service } from "../types";
import { Button } from "@/components/ui/button";

type Props = {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onTogglePinned: (service: Service) => void;
  onRefresh: (service: Service) => void;
};

export function ServiceCard({ service, onEdit, onDelete, onTogglePinned, onRefresh }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: service.id,
    data: { section: service.isPinned ? "pinned" : "regular" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group flex h-full flex-col rounded-2xl border border-zinc-200/70 bg-white/90 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/10 dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="flex items-start justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-xl p-1 text-zinc-500 hover:bg-zinc-100 hover:text-violet-600 dark:hover:bg-zinc-800 dark:hover:text-violet-300"
          {...attributes}
          {...listeners}
          aria-label="Drag service"
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-w-0 flex-1 justify-start p-0 text-left hover:bg-transparent"
          onClick={() =>
            window.open(
              service.url,
              service.openInNewTab ? "_blank" : "_self",
              "noopener,noreferrer",
            )
          }
        >
          <div className="flex items-center gap-2">
            {service.icon ? (
              <img src={service.icon} alt="" className="h-9 w-9 rounded-xl ring-1 ring-black/5 dark:ring-white/10" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{service.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Button>
      </div>

      {service.stats && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(service.stats).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] leading-none text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200"
            >
              <span className="font-medium capitalize text-zinc-500 dark:text-zinc-400">{key}</span>
              <span className="font-semibold text-violet-700 dark:text-violet-300">{value}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-end gap-1 pt-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl p-1.5 hover:bg-zinc-100 hover:text-violet-600 dark:hover:bg-zinc-800 dark:hover:text-violet-300"
          onClick={() => onRefresh(service)}
          title="Refresh stats"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-xl p-1.5 hover:bg-zinc-100 hover:text-violet-600 dark:hover:bg-zinc-800 dark:hover:text-violet-300 ${
            service.isPinned ? "text-violet-600 dark:text-violet-300" : ""
          }`}
          onClick={() => onTogglePinned(service)}
          title="Toggle pin"
        >
          <Pin className={`h-4 w-4 ${service.isPinned ? "fill-current" : ""}`} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl p-1.5 hover:bg-zinc-100 hover:text-violet-600 dark:hover:bg-zinc-800 dark:hover:text-violet-300"
          onClick={() => onEdit(service)}
          title="Edit"
          aria-label="Edit"
        >
          <PenSquare className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
          onClick={() => onDelete(service)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
