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
