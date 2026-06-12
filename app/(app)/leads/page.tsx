import { LeadCenter } from "@/components/LeadCenter";
import { getAppSettings } from "@/lib/settings";

export default async function LeadsPage() {
  const { industry } = await getAppSettings();
  return <LeadCenter defaultIndustry={industry} />;
}
