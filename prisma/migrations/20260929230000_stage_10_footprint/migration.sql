CREATE TABLE "footprint_cities" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,
    "city_name" VARCHAR(120) NOT NULL,
    "region_name" VARCHAR(120),
    "geo_provider" VARCHAR(80) NOT NULL,
    "geo_code" VARCHAR(160),
    "local_geojson_path" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "footprint_cities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "footprint_memories" (
    "id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "body" TEXT NOT NULL,
    "occurred_on" DATE,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "footprint_memories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "footprint_memory_media" (
    "id" UUID NOT NULL,
    "memory_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "footprint_memory_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "footprint_cities_slug_key"
ON "footprint_cities"("slug");
CREATE INDEX "footprint_cities_country_code_sort_order_idx"
ON "footprint_cities"("country_code", "sort_order");
CREATE INDEX "footprint_memories_city_id_visible_sort_order_idx"
ON "footprint_memories"("city_id", "visible", "sort_order");
CREATE UNIQUE INDEX "footprint_memory_media_memory_id_media_id_key"
ON "footprint_memory_media"("memory_id", "media_id");
CREATE INDEX "footprint_memory_media_memory_id_sort_order_idx"
ON "footprint_memory_media"("memory_id", "sort_order");

ALTER TABLE "footprint_memories"
ADD CONSTRAINT "footprint_memories_city_id_fkey"
FOREIGN KEY ("city_id") REFERENCES "footprint_cities"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "footprint_memory_media"
ADD CONSTRAINT "footprint_memory_media_memory_id_fkey"
FOREIGN KEY ("memory_id") REFERENCES "footprint_memories"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "footprint_memory_media_media_id_fkey"
FOREIGN KEY ("media_id") REFERENCES "media_assets"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
