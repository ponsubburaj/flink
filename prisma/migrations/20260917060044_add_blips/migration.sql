-- CreateTable
CREATE TABLE "Blip" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlipView" (
    "id" TEXT NOT NULL,
    "blipId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlipView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlipLike" (
    "id" TEXT NOT NULL,
    "blipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlipLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlipView_blipId_viewerId_key" ON "BlipView"("blipId", "viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlipLike_blipId_userId_key" ON "BlipLike"("blipId", "userId");

-- AddForeignKey
ALTER TABLE "Blip" ADD CONSTRAINT "Blip_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlipView" ADD CONSTRAINT "BlipView_blipId_fkey" FOREIGN KEY ("blipId") REFERENCES "Blip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlipView" ADD CONSTRAINT "BlipView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlipLike" ADD CONSTRAINT "BlipLike_blipId_fkey" FOREIGN KEY ("blipId") REFERENCES "Blip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlipLike" ADD CONSTRAINT "BlipLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
