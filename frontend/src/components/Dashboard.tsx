import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Service } from "../types";
import { ServiceCard } from "./ServiceCard";

type Props = {
  services: Service[];
  onServicesOrderChange: (services: Service[]) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onTogglePinned: (service: Service) => void;
  onRefresh: (service: Service) => void;
};

function splitServices(services: Service[]) {
  return {
    pinned: services.filter((s) => s.isPinned),
    regular: services.filter((s) => !s.isPinned),
  };
}

export function Dashboard({
  services,
  onServicesOrderChange,
  onEdit,
  onDelete,
  onTogglePinned,
  onRefresh,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const { pinned, regular } = splitServices(services);

  function reorderCollections(updatedPinned: Service[], updatedRegular: Service[]) {
    const next = [
      ...updatedPinned.map((s, idx) => ({ ...s, isPinned: true, pinnedSortOrder: idx })),
      ...updatedRegular.map((s, idx) => ({ ...s, isPinned: false, sortOrder: idx })),
    ];
    onServicesOrderChange(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeService = services.find((s) => s.id === Number(active.id));
    const overService = services.find((s) => s.id === Number(over.id));
    if (!activeService || !overService) {
      return;
    }

    const activeInPinned = activeService.isPinned;
    const overInPinned = overService.isPinned;

    if (activeInPinned === overInPinned) {
      if (activeInPinned) {
        const oldIdx = pinned.findIndex((s) => s.id === activeService.id);
        const newIdx = pinned.findIndex((s) => s.id === overService.id);
        reorderCollections(arrayMove(pinned, oldIdx, newIdx), regular);
      } else {
        const oldIdx = regular.findIndex((s) => s.id === activeService.id);
        const newIdx = regular.findIndex((s) => s.id === overService.id);
        reorderCollections(pinned, arrayMove(regular, oldIdx, newIdx));
      }
      return;
    }

    const nextPinned = [...pinned];
    const nextRegular = [...regular];

    if (activeInPinned && !overInPinned) {
      const from = nextPinned.findIndex((s) => s.id === activeService.id);
      const [moved] = nextPinned.splice(from, 1);
      const target = nextRegular.findIndex((s) => s.id === overService.id);
      nextRegular.splice(target, 0, { ...moved, isPinned: false });
    } else if (!activeInPinned && overInPinned) {
      const from = nextRegular.findIndex((s) => s.id === activeService.id);
      const [moved] = nextRegular.splice(from, 1);
      const target = nextPinned.findIndex((s) => s.id === overService.id);
      nextPinned.splice(target, 0, { ...moved, isPinned: true });
    }

    reorderCollections(nextPinned, nextRegular);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Pinned
          </h2>
          <SortableContext items={pinned.map((s) => s.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {pinned.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePinned={onTogglePinned}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </SortableContext>
          {pinned.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
              Pin services to keep them at the top.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            All Services
          </h2>
          <SortableContext items={regular.map((s) => s.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {regular.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePinned={onTogglePinned}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </SortableContext>
          {regular.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
              No services match your filters.
            </p>
          )}
        </div>
      </section>
    </DndContext>
  );
}
