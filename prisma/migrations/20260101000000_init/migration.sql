-- CreateTable
CREATE TABLE "pastes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),
    "max_views" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pastes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pastes_expires_at_idx" ON "pastes"("expires_at");
