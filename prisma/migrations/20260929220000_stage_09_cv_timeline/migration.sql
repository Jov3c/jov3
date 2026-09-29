CREATE TYPE "DatePrecision" AS ENUM ('YEAR', 'MONTH', 'DAY');

CREATE TABLE "cv_profile" (
    "id" UUID NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "name" VARCHAR(120) NOT NULL,
    "headline" VARCHAR(180) NOT NULL,
    "bio" TEXT NOT NULL,
    "location" VARCHAR(120) NOT NULL,
    "website" VARCHAR(500),
    "status_text" VARCHAR(120),
    "statement" TEXT NOT NULL,
    "portrait_media_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "cv_profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cv_experiences" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "company" VARCHAR(180) NOT NULL,
    "role" VARCHAR(180) NOT NULL,
    "location" VARCHAR(120) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "cv_experiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cv_educations" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "school" VARCHAR(180) NOT NULL,
    "major" VARCHAR(180) NOT NULL,
    "degree" VARCHAR(120) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "cv_educations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cv_skill_groups" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "cv_skill_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cv_project_refs" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "cv_project_refs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "timeline_entries" (
    "id" UUID NOT NULL,
    "event_date" DATE NOT NULL,
    "date_precision" "DatePrecision" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "body_markdown" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "timeline_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "timeline_entry_media" (
    "id" UUID NOT NULL,
    "timeline_entry_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "timeline_entry_media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "timeline_entry_links" (
    "id" UUID NOT NULL,
    "timeline_entry_id" UUID NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "timeline_entry_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "timeline_entry_projects" (
    "id" UUID NOT NULL,
    "timeline_entry_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "timeline_entry_projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cv_project_refs_profile_id_project_id_key"
ON "cv_project_refs"("profile_id", "project_id");
CREATE INDEX "cv_experiences_profile_id_sort_order_idx"
ON "cv_experiences"("profile_id", "sort_order");
CREATE INDEX "cv_educations_profile_id_sort_order_idx"
ON "cv_educations"("profile_id", "sort_order");
CREATE INDEX "cv_skill_groups_profile_id_sort_order_idx"
ON "cv_skill_groups"("profile_id", "sort_order");
CREATE INDEX "cv_project_refs_profile_id_sort_order_idx"
ON "cv_project_refs"("profile_id", "sort_order");
CREATE INDEX "timeline_entries_visible_event_date_sort_order_idx"
ON "timeline_entries"("visible", "event_date", "sort_order");
CREATE UNIQUE INDEX "timeline_entry_media_timeline_entry_id_media_id_key"
ON "timeline_entry_media"("timeline_entry_id", "media_id");
CREATE INDEX "timeline_entry_media_timeline_entry_id_sort_order_idx"
ON "timeline_entry_media"("timeline_entry_id", "sort_order");
CREATE INDEX "timeline_entry_links_timeline_entry_id_sort_order_idx"
ON "timeline_entry_links"("timeline_entry_id", "sort_order");
CREATE UNIQUE INDEX "timeline_entry_projects_timeline_entry_id_project_id_key"
ON "timeline_entry_projects"("timeline_entry_id", "project_id");
CREATE INDEX "timeline_entry_projects_timeline_entry_id_sort_order_idx"
ON "timeline_entry_projects"("timeline_entry_id", "sort_order");

ALTER TABLE "cv_profile"
ADD CONSTRAINT "cv_profile_portrait_media_id_fkey"
FOREIGN KEY ("portrait_media_id") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cv_experiences"
ADD CONSTRAINT "cv_experiences_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "cv_profile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cv_educations"
ADD CONSTRAINT "cv_educations_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "cv_profile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cv_skill_groups"
ADD CONSTRAINT "cv_skill_groups_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "cv_profile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cv_project_refs"
ADD CONSTRAINT "cv_project_refs_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "cv_profile"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "cv_project_refs_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "timeline_entry_media"
ADD CONSTRAINT "timeline_entry_media_timeline_entry_id_fkey"
FOREIGN KEY ("timeline_entry_id") REFERENCES "timeline_entries"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "timeline_entry_media_media_id_fkey"
FOREIGN KEY ("media_id") REFERENCES "media_assets"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "timeline_entry_links"
ADD CONSTRAINT "timeline_entry_links_timeline_entry_id_fkey"
FOREIGN KEY ("timeline_entry_id") REFERENCES "timeline_entries"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "timeline_entry_projects"
ADD CONSTRAINT "timeline_entry_projects_timeline_entry_id_fkey"
FOREIGN KEY ("timeline_entry_id") REFERENCES "timeline_entries"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "timeline_entry_projects_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
