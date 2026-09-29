CREATE TYPE "ProjectStatus" AS ENUM ('BUILDING', 'ACTIVE', 'DONE', 'PAUSED');

CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(400) NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "tech_stack" TEXT[] NOT NULL,
    "github_url" VARCHAR(500),
    "demo_url" VARCHAR(500),
    "readme_markdown" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");
CREATE INDEX "projects_visible_sort_order_idx" ON "projects"("visible", "sort_order");
