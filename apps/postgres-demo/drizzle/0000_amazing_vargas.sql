CREATE TABLE "meta" (
	"enabled" boolean DEFAULT true,
	"airtableBaseId" text NOT NULL,
	"airtableTableId" text NOT NULL,
	"airtableFieldId" text NOT NULL,
	"pgTable" text NOT NULL,
	"pgField" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL
);
