-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'CUSTOMER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `compareAt` INTEGER NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `sku` VARCHAR(191) NOT NULL,
    `images` TEXT NOT NULL,
    `colors` TEXT NULL,
    `sizes` TEXT NULL,
    `colorImages` TEXT NULL,
    `youtubeUrl` VARCHAR(191) NULL,
    `metal` VARCHAR(191) NULL,
    `occasion` VARCHAR(191) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isNew` BOOLEAN NOT NULL DEFAULT false,
    `categoryId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `position` INTEGER NOT NULL DEFAULT 0,
    `lowStockAt` INTEGER NOT NULL DEFAULT 5,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    UNIQUE INDEX `Product_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `trackingCode` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `total` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'UNPAID',
    `paymentMethod` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_trackingCode_key`(`trackingCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` INTEGER NOT NULL,
    `color` VARCHAR(191) NULL,
    `size` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WishlistItem` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WishlistItem_userId_productId_key`(`userId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `percent` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryMovement` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryMovement_productId_createdAt_idx`(`productId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetToken_tokenHash_key`(`tokenHash`),
    INDEX `PasswordResetToken_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetToken` ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Monimala Store Initial Seed Data for Hostinger MySQL 8
-- Default Admin Account: admin@monimalastore.com / Admin@12345

INSERT INTO `User` (`id`, `name`, `email`, `passwordHash`, `role`, `createdAt`, `updatedAt`)
VALUES ('usr_admin_seed_01', 'Monimala Admin', 'admin@monimalastore.com', '$2b$12$EvxbU14rXgC6nsalU6ZcHOWe9VOHICWyG.AAO9mnurScepVKPl0oK', 'ADMIN', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `role` = 'ADMIN';

-- Initial Categories
INSERT INTO `Category` (`id`, `name`, `slug`, `description`, `image`, `active`, `position`, `createdAt`, `updatedAt`)
VALUES 
('cat_necklaces', 'Traditional Necklaces', 'necklaces', 'Traditional Necklaces by Monimala Store', '/images/monimala-hero.png', 1, 1, NOW(3), NOW(3)),
('cat_earrings', 'Earrings', 'earrings', 'Earrings by Monimala Store', '/images/monimala-hero.png', 1, 2, NOW(3), NOW(3)),
('cat_bridal', 'Bridal Collection', 'bridal', 'Bridal Collection by Monimala Store', '/images/monimala-hero.png', 1, 3, NOW(3), NOW(3)),
('cat_jonbiri', 'Jonbiri', 'jonbiri', 'Jonbiri by Monimala Store', '/images/monimala-hero.png', 1, 4, NOW(3), NOW(3)),
('cat_gamkharu', 'Gamkharu', 'gamkharu', 'Gamkharu by Monimala Store', '/images/monimala-hero.png', 1, 5, NOW(3), NOW(3)),
('cat_lokaparo', 'Lokaparo', 'lokaparo', 'Lokaparo by Monimala Store', '/images/monimala-hero.png', 1, 6, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Initial Products
INSERT INTO `Product` (`id`, `name`, `slug`, `sku`, `description`, `price`, `compareAt`, `stock`, `images`, `metal`, `occasion`, `isFeatured`, `isNew`, `categoryId`, `active`, `position`, `lowStockAt`, `createdAt`, `updatedAt`)
VALUES
('p1', 'Royal Jonbiri Bridal Necklace', 'royal-jonbiri-bridal-necklace', 'MONI-P1', 'Royal Jonbiri Bridal Necklace with premium Assamese heritage styling.', 5499, 6999, 14, '["/images/monimala-hero.png"]', 'Gold Finish', 'Bridal', 1, 0, 'cat_jonbiri', 1, 1, 5, NOW(3), NOW(3)),
('p2', 'Gamkharu Heritage Bangle Pair', 'gamkharu-heritage-bangle-pair', 'MONI-P2', 'Gamkharu Heritage Bangle Pair with premium Assamese heritage styling.', 3299, 3999, 21, '["/images/monimala-hero.png"]', 'Gold Finish', 'Heritage', 1, 0, 'cat_gamkharu', 1, 2, 5, NOW(3), NOW(3)),
('p3', 'Lokaparo Gold Drop Earrings', 'lokaparo-gold-drop-earrings', 'MONI-P3', 'Lokaparo Gold Drop Earrings with premium Assamese heritage styling.', 1699, 2199, 36, '["/images/monimala-hero.png"]', 'Gold Finish', 'Heritage', 0, 1, 'cat_lokaparo', 1, 3, 5, NOW(3), NOW(3)),
('p4', 'Assamese Bridal Layered Set', 'assamese-bridal-layered-set', 'MONI-P4', 'Assamese Bridal Layered Set with premium Assamese heritage styling.', 8999, 10999, 8, '["/images/monimala-hero.png"]', 'Gold Finish', 'Bridal', 1, 0, 'cat_bridal', 1, 4, 5, NOW(3), NOW(3)),
('p5', 'Festival Kemp Necklace', 'festival-kemp-necklace', 'MONI-P5', 'Festival Kemp Necklace with premium Assamese heritage styling.', 2499, NULL, 25, '["/images/monimala-hero.png"]', 'Gold Finish', 'Heritage', 0, 1, 'cat_necklaces', 1, 5, 5, NOW(3), NOW(3)),
('p6', 'Everyday Pearl Japi Studs', 'everyday-pearl-japi-studs', 'MONI-P6', 'Everyday Pearl Japi Studs with premium Assamese heritage styling.', 999, NULL, 54, '["/images/monimala-hero.png"]', 'Gold Finish', 'Heritage', 0, 1, 'cat_earrings', 1, 6, 5, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Initial Promotional Coupon
INSERT INTO `Coupon` (`id`, `code`, `percent`, `active`, `expiresAt`)
VALUES ('cpn_bihu10', 'BIHU10', 10, 1, NULL)
ON DUPLICATE KEY UPDATE `percent` = 10;
