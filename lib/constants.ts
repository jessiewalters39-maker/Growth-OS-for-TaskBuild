// Home-service verticals TaskBuildAI sells into. Used by the industry selector,
// lead forms, and CSV import normalization.
export const INDUSTRIES = [
  "Roofing",
  "HVAC",
  "Plumbing",
  "Landscaping",
  "Cleaning",
  "Electrical",
  "Pest Control",
  "Remodeling",
  "Painting",
  "Pools",
  "Tree Services",
  "General Contractor",
  "Garage Doors",
  "Junk Removal",
  "Pressure Washing",
  "Concrete",
] as const;

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "demo_booked",
  "customer",
  "lost",
] as const;

export const LEAD_TIERS = ["Hot", "Warm", "Cold"] as const;

export const LEAD_SOURCES = [
  "Manual",
  "Website Form",
  "Chat",
  "SMS",
  "CSV Import",
  "Scrape",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  demo_booked: "Demo Booked",
  customer: "Customer",
  lost: "Lost",
};
