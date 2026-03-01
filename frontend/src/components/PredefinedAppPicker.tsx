import { predefinedApps } from "../lib/predefined-apps";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function PredefinedAppPicker({ selectedId, onSelect }: Props) {
  const selectedApp = predefinedApps.find((app) => app.id === selectedId);
  return (
    <div className="space-y-2">
      <Label
        htmlFor="predefined-app"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-zinc-300"
      >
        Application Type
      </Label>
      <Card className="bg-card/80 shadow-sm">
        <CardContent className="p-3">
          <Select
            id="predefined-app"
            value={selectedId ?? ""}
            onChange={(e) => onSelect(e.target.value || null)}
          >
            <option value="">Custom app</option>
            {predefinedApps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </Select>
          {selectedApp && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-2">
              <img src={selectedApp.icon} alt="" className="h-7 w-7 rounded-md" />
              <div>
                <p className="text-sm font-medium text-foreground">{selectedApp.name}</p>
                <p className="text-xs text-muted-foreground">Predefined icon and API fields loaded</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
