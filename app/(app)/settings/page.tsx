import { Card } from "@/components/ui";
import { getAppSettings } from "@/lib/settings";

export default async function SettingsPage() {
  const { industry, location } = await getAppSettings();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card>
        <div className="text-sm text-muted">Current mode</div>
        <div className="mt-1 text-lg font-medium">
          {industry}
          {location ? ` · ${location}` : ""}
        </div>
        <p className="mt-2 text-sm text-muted">
          Change the industry/location mode from the top bar. Webhook docs and
          connection status are added in M1 and M3.
        </p>
      </Card>
    </div>
  );
}
