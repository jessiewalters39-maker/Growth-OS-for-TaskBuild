"use client";

import type { Lead } from "@/lib/schema";

// Placeholder for M1. The Outreach Engine (AI sequence generation, copy
// buttons, mailto/sms links) is built in M2 and replaces this component.
export function OutreachTab({ lead }: { lead: Lead }) {
  void lead;
  return (
    <div className="text-sm text-muted">
      The Outreach Engine is built in milestone M2. It will generate a
      personalized 9-message campaign (5 emails, 2 SMS, 2 LinkedIn) here, each
      with copy buttons and quick-send links.
    </div>
  );
}
