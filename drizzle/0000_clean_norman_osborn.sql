CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"cal_uid" text NOT NULL,
	"email" text,
	"status" text,
	"start_time" timestamp with time zone,
	"lead_id" integer,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bookings_cal_uid_unique" UNIQUE("cal_uid")
);
--> statement-breakpoint
CREATE TABLE "cmo_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_of" date NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_id" text NOT NULL,
	"email" text,
	"status" text,
	"mrr_cents" integer DEFAULT 0 NOT NULL,
	"lead_id" integer,
	"industry" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customers_stripe_id_unique" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"owner" text,
	"email" text,
	"phone" text,
	"website" text,
	"city" text,
	"state" text,
	"industry" text DEFAULT 'Roofing' NOT NULL,
	"source" text DEFAULT 'Manual' NOT NULL,
	"landing_page" text,
	"status" text DEFAULT 'new' NOT NULL,
	"tier" text,
	"score" integer,
	"score_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "leads_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "metrics_daily" (
	"date" date PRIMARY KEY NOT NULL,
	"leads_total" integer,
	"leads_new_7d" integer,
	"demos_total" integer,
	"demos_upcoming" integer,
	"no_shows" integer,
	"customers_active" integer,
	"mrr_cents" integer,
	"churned_total" integer,
	"past_due" integer
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;