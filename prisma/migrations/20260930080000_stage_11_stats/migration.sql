CREATE TABLE "page_view_daily" (
    "date" DATE NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "views" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "page_view_daily_pkey" PRIMARY KEY ("date", "path")
);

CREATE TABLE "visitor_activity" (
    "visitor_hash" CHAR(64) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "visitor_activity_pkey" PRIMARY KEY ("visitor_hash")
);

CREATE INDEX "page_view_daily_date_idx" ON "page_view_daily"("date");
CREATE INDEX "visitor_activity_last_seen_at_idx" ON "visitor_activity"("last_seen_at");
