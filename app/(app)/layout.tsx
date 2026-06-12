import { TopBar } from "@/components/TopBar";
import { getAppSettings } from "@/lib/settings";

// Authenticated pages show live data (settings, leads, metrics) — never
// prerender them, or production would freeze the default mode and stale counts.
export const dynamic = "force-dynamic";

// Shell for all authenticated pages (Dashboard, Lead Center, CMO, Settings).
// /login lives outside this group so it renders bare. Middleware enforces auth.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { industry, location } = await getAppSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar industry={industry} location={location} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
