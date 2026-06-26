CREATE TABLE IF NOT EXISTS "search_console_daily" (
	"date" date PRIMARY KEY NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"ctr_bps" integer DEFAULT 0 NOT NULL,
	"position_x10" integer DEFAULT 0 NOT NULL,
	"top_queries" jsonb,
	"top_pages" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "has_chatbot" boolean;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "chatbot_vendor" text;
