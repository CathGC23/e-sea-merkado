-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: seller_auth_db
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `buyer_notifications`
--

DROP TABLE IF EXISTS `buyer_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buyer_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(255) NOT NULL,
  `order_id` int NOT NULL,
  `seller_id` varchar(100) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_read` (`is_read`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buyer_notifications`
--

LOCK TABLES `buyer_notifications` WRITE;
/*!40000 ALTER TABLE `buyer_notifications` DISABLE KEYS */;
INSERT INTO `buyer_notifications` VALUES (1,'cath0000',20,'SELL-GFGDHQ','Your order #20 status has been updated to: Preparing',0,'2025-11-28 06:19:17'),(2,'KathrineClosa09517397968',21,'SELL-GFGDHQ','Your order #21 status has been updated to: Preparing',1,'2025-11-28 06:37:02'),(3,'cath0000',20,'SELL-GFGDHQ','Your order #20 status has been updated to: Completed',0,'2025-11-28 06:44:13'),(4,'KathrineClosa09517397968',21,'SELL-GFGDHQ','Your order #21 status has been updated to: Completed',1,'2025-11-28 06:44:19'),(5,'KathrineClosa09517397968',22,'SELL-GFGDHQ','Your order #22 status has been updated to: Preparing',1,'2025-11-28 06:44:26'),(6,'KathrineClosa09517397968',22,'SELL-GFGDHQ','Your order #22 status has been updated to: Completed',1,'2025-11-28 06:46:51'),(7,'KathrineClosa09517397968',23,'SELL-GFGDHQ','Your order #23 status has been updated to: Completed',1,'2025-11-28 06:47:10'),(8,'KathrineClosa09517397968',24,'SELL-GFGDHQ','Your order #24 status has been updated to: Preparing',1,'2025-11-28 07:30:15'),(9,'KathrineClosa09517397968',24,'SELL-GFGDHQ','Your order #24 status has been updated to: Completed',1,'2025-11-28 07:31:13'),(10,'KathrineClosa09517397968',25,'SELL-GFGDHQ','Your order #25 status has been updated to: Completed',1,'2025-11-28 08:00:57'),(11,'KianAndreiPortes09090909090',26,'SELL-GFGDHQ','Your order #26 status has been updated to: Preparing',0,'2025-11-28 08:17:51'),(12,'KianAndreiPortes09090909090',26,'SELL-GFGDHQ','Your order #26 status has been updated to: Completed',0,'2025-11-28 08:27:33'),(13,'KianAndreiPortes09090909090',27,'SELL-GFGDHQ','Your order #27 status has been updated to: Completed',0,'2025-11-28 08:27:40'),(14,'KianAndreiPortes09090909090',26,'SELL-GFGDHQ','Your order #26 status has been updated to: Completed',0,'2025-11-28 08:34:28'),(15,'KathrineClosa09517397968',28,'SELL-GFGDHQ','Your order #28 status has been updated to: Completed',1,'2025-11-28 08:36:55'),(16,'KianAndreiPortes09090909090',29,'SELL-GFGDHQ','Your order #29 status has been updated to: Completed',0,'2025-11-28 08:49:49');
/*!40000 ALTER TABLE `buyer_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fish_categories`
--

DROP TABLE IF EXISTS `fish_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fish_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `seller_id` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_per_seller` (`category_name`,`seller_id`),
  KEY `fk_category_seller` (`seller_id`),
  CONSTRAINT `fk_category_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fish_categories`
--

LOCK TABLES `fish_categories` WRITE;
/*!40000 ALTER TABLE `fish_categories` DISABLE KEYS */;
INSERT INTO `fish_categories` VALUES (1,'Freshwater','SELL-GFGDHQ','2025-11-22 09:31:30'),(2,'Saltwater','SELL-GFGDHQ','2025-11-22 09:31:30'),(3,'Shellfish','SELL-GFGDHQ','2025-11-22 09:31:30'),(4,'Crustaceans','SELL-GFGDHQ','2025-11-22 09:31:30'),(5,'Premium Fish','SELL-GFGDHQ','2025-11-22 09:31:30'),(6,'Freshwater','SELL-7LED1Z','2025-11-23 07:39:17'),(7,'Saltwater','SELL-7LED1Z','2025-11-23 07:39:17'),(8,'Shellfish','SELL-7LED1Z','2025-11-23 07:39:17'),(9,'Crustaceans','SELL-7LED1Z','2025-11-23 07:39:17'),(10,'Premium Fish','SELL-7LED1Z','2025-11-23 07:39:17'),(51,'Freshwater','SELL-7H8FD1','2025-11-28 03:26:08'),(52,'Saltwater','SELL-7H8FD1','2025-11-28 03:26:08'),(53,'Shellfish','SELL-7H8FD1','2025-11-28 03:26:08'),(54,'Crustaceans','SELL-7H8FD1','2025-11-28 03:26:08'),(55,'Premium Fish','SELL-7H8FD1','2025-11-28 03:26:08');
/*!40000 ALTER TABLE `fish_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fish_products`
--

DROP TABLE IF EXISTS `fish_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fish_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `previous_price` decimal(10,2) DEFAULT NULL,
  `stock` int NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `seller_id` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fish_products`
--

LOCK TABLES `fish_products` WRITE;
/*!40000 ALTER TABLE `fish_products` DISABLE KEYS */;
INSERT INTO `fish_products` VALUES (6,'lapu-lapu','Saltwater','kg',400.00,400.00,6,'1763831019396-tilapia.jpg','SELL-GFGDHQ','2025-11-16 15:23:06'),(7,'salmon','Saltwater','kg',160.00,NULL,7,'1763525116684-sea-merkado-logo.png','SELL-7LED1Z','2025-11-19 04:04:21'),(8,'fish','Saltwater','kg',100.00,100.00,50,'1763830997168-tilapia.jpg','SELL-GFGDHQ','2025-11-19 07:12:38'),(9,'hhh','Shellfish','kg',122.00,122.00,7,'1763830974903-tilapia.jpg','SELL-GFGDHQ','2025-11-19 10:26:46'),(10,'aaaaaa','Freshwater','kg',222.00,222.00,18,'1763830947773-tilapia.jpg','SELL-GFGDHQ','2025-11-20 07:06:00'),(11,'ccccc','Freshwater','kg',160.00,155.00,0,'1763830920234-tilapia.jpg','SELL-GFGDHQ','2025-11-22 09:37:59'),(12,'Tilapia','Freshwater','kg',140.00,130.00,7,'1763830898903-tilapia.jpg','SELL-GFGDHQ','2025-11-22 16:27:34'),(13,'Tilapia','Freshwater','kg',153.33,160.00,23,'1763830577822-tilapia.jpg','SELL-GFGDHQ','2025-11-22 16:45:14');
/*!40000 ALTER TABLE `fish_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `fish_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,11,1,150.00),(2,2,10,2,222.00),(3,3,12,2,120.00),(4,4,11,1,150.00),(5,5,13,1,120.00),(6,6,12,1,120.00),(7,7,12,1,120.00),(8,8,12,1,120.00),(9,9,12,1,120.00),(10,10,12,1,120.00),(11,11,12,1,120.00),(12,12,13,1,153.33),(13,13,13,2,153.33),(14,14,12,1,140.00),(15,15,11,1,160.00),(16,16,13,1,153.33),(17,17,11,1,160.00),(18,18,11,1,160.00),(19,19,12,1,140.00),(20,20,11,1,160.00),(21,21,11,1,160.00),(22,22,11,1,160.00),(23,23,11,1,160.00),(24,24,13,1,153.33),(25,25,11,1,160.00),(26,26,12,1,140.00),(27,27,12,1,140.00),(28,28,13,1,153.33),(29,29,12,1,140.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_id` varchar(50) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `contact` varchar(100) DEFAULT NULL,
  `customer_id` varchar(255) DEFAULT NULL,
  `notes` text,
  `total` decimal(10,2) DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,
  `paid` tinyint(1) DEFAULT '0',
  `proof_of_payment` varchar(500) DEFAULT NULL,
  `order_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (`id`),
  KEY `fk_orders_seller` (`seller_id`),
  KEY `idx_customer_id` (`customer_id`),
  CONSTRAINT `fk_orders_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'SELL-GFGDHQ','cacaccaca','msjs','0000','cacaccaca0000','wala',150.00,'Gcash QR',1,NULL,'2025-11-22 13:43:02','Completed'),(2,'SELL-GFGDHQ','babababa','bibibibi','0000','babababa0000','wala',444.00,'Gcash QR',1,NULL,'2025-11-22 16:07:43','Completed'),(3,'SELL-GFGDHQ','','','','','',240.00,'Gcash QR',1,NULL,'2025-11-23 08:08:39','Completed'),(4,'SELL-GFGDHQ','catherine closa','bababbabba','00000','catherineclosa00000','',150.00,'Gcash QR',1,NULL,'2025-11-23 08:18:34','Cancelled'),(5,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',120.00,'Gcash QR',1,NULL,'2025-11-23 08:29:57','Completed'),(6,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',120.00,'Gcash QR',1,NULL,'2025-11-23 12:56:39','Completed'),(7,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',120.00,'Gcash QR',1,NULL,'2025-11-24 10:26:51','Completed'),(8,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',120.00,'Gcash QR',1,NULL,'2025-11-24 10:54:49','Completed'),(9,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',120.00,'Gcash QR',1,NULL,'2025-11-24 12:17:01','Completed'),(10,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',120.00,'Gcash QR',1,NULL,'2025-11-24 12:25:02','Completed'),(11,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',120.00,'Gcash QR',1,NULL,'2025-11-24 12:41:06','Completed'),(12,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',153.33,'Gcash QR',1,NULL,'2025-11-24 13:29:23','Cancelled'),(13,'SELL-GFGDHQ','cath closa','meow','0000','cathclosa0000','',306.66,'Gcash QR',1,'/uploads/1764129524855-1763954589043-shop_logo.jpg','2025-11-26 03:58:44','Completed'),(14,'SELL-GFGDHQ','haha','hoho','0000','haha0000','',140.00,'Gcash QR',1,'/uploads/1764248134555-user1.jpg','2025-11-27 12:55:34','Completed'),(15,'SELL-GFGDHQ','cacacca','hahahha','00000','cacacca00000','',160.00,'Gcash QR',1,'/uploads/1764262973153-backend-icon-design-free-vector.jpg','2025-11-27 17:02:53','Completed'),(16,'SELL-GFGDHQ','cath','babababa','0000','cath0000','wala',153.33,'Gcash QR',1,'/uploads/1764298048576-backend-icon-design-free-vector.jpg','2025-11-28 02:47:28','Completed'),(17,'SELL-GFGDHQ','cath','babababa','0000','cath0000','',160.00,'Gcash QR',1,'/uploads/1764302660275-backend-icon-design-free-vector.jpg','2025-11-28 04:04:20','Completed'),(18,'SELL-GFGDHQ','cath','babababa','0000','cath0000','',160.00,'Gcash QR',1,'/uploads/1764303097927-backend-icon-design-free-vector.jpg','2025-11-28 04:11:37','Completed'),(19,'SELL-GFGDHQ','kianportes','hahahahahhahahahahaha','92929292929','kianportes92929292929','',140.00,'Gcash QR',1,'/uploads/1764309254684-admin.jpg','2025-11-28 05:54:14','Completed'),(20,'SELL-GFGDHQ','cath','babababa','0000','cath0000','',160.00,'Gcash QR',1,'/uploads/1764310726223-backend-icon-design-free-vector.jpg','2025-11-28 06:18:46','Completed'),(21,'SELL-GFGDHQ','Catherine Closa','Sitio Highway, Victoria, Roxas, Oriental Mindoro','09517397968','KathrineClosa09517397968','wala',160.00,'Gcash QR',1,'/uploads/1764311797863-backend-icon-design-free-vector.jpg','2025-11-28 06:36:38','Completed'),(22,'SELL-GFGDHQ','Catherine Closa','Sitio Highway, Victoria, Roxas, Oriental Mindoro','09517397968','KathrineClosa09517397968','',160.00,'Gcash QR',1,'/uploads/1764312234562-backend-icon-design-free-vector.jpg','2025-11-28 06:43:54','Completed'),(23,'SELL-GFGDHQ','Cath','hahahahaha','00000','KathrineClosa09517397968','',160.00,'Gcash QR',1,'/uploads/1764312378748-tilapia.jpg','2025-11-28 06:46:18','Completed'),(24,'SELL-GFGDHQ','Cath','hahahahaha','00000','KathrineClosa09517397968','',153.33,'Gcash QR',1,'/uploads/1764314893973-tilapia.jpg','2025-11-28 07:28:14','Completed'),(25,'SELL-GFGDHQ','Catherine Closa','Sitio Highway, Victoria, Roxas, Oriental Mindoro','09517397968','KathrineClosa09517397968','',160.00,'Gcash QR',1,'/uploads/1764316837426-backend-icon-design-free-vector.jpg','2025-11-28 08:00:37','Completed'),(26,'SELL-GFGDHQ','Kian Andrei Portes','Libtong, Roxas, Oriental Mindoro','09263042618','KianAndreiPortes09090909090','',140.00,'Gcash QR',1,'/uploads/1764317837230-backend-icon-design-free-vector.jpg','2025-11-28 08:17:17','Completed'),(27,'SELL-GFGDHQ','Kian Andrei Portes','Libtong, Roxas, Oriental Mindoro','09263042618','KianAndreiPortes09090909090','',140.00,'Gcash QR',1,'/uploads/1764318434883-tilapia.jpg','2025-11-28 08:27:15','Completed'),(28,'SELL-GFGDHQ','Cath','hahahahaha','00000','KathrineClosa09517397968','',153.33,'Gcash QR',1,'/uploads/1764318976205-tilapia.jpg','2025-11-28 08:36:16','Completed'),(29,'SELL-GFGDHQ','Kian Andrei Portes','Libtong, Roxas, Oriental Mindoro','09263042618','KianAndreiPortes09090909090','',140.00,'Gcash QR',1,'/uploads/1764319765197-tilapia.jpg','2025-11-28 08:49:25','Completed');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_history`
--

DROP TABLE IF EXISTS `price_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `seller_id` varchar(255) NOT NULL,
  `old_price` decimal(10,2) NOT NULL,
  `new_price` decimal(10,2) NOT NULL,
  `change_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `seller_id` (`seller_id`),
  CONSTRAINT `price_history_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `fish_products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `price_history_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_history`
--

LOCK TABLES `price_history` WRITE;
/*!40000 ALTER TABLE `price_history` DISABLE KEYS */;
INSERT INTO `price_history` VALUES (1,13,'SELL-GFGDHQ',120.00,140.00,'2025-11-24 06:40:11'),(2,13,'SELL-GFGDHQ',140.00,160.00,'2025-11-24 06:40:29'),(3,13,'SELL-GFGDHQ',160.00,153.33,'2025-11-24 06:42:07'),(4,11,'SELL-GFGDHQ',150.00,155.00,'2025-11-24 07:47:10'),(5,11,'SELL-GFGDHQ',155.00,160.00,'2025-11-24 07:47:26'),(6,12,'SELL-GFGDHQ',120.00,130.00,'2025-11-26 01:51:15'),(7,12,'SELL-GFGDHQ',130.00,140.00,'2025-11-26 01:51:37');
/*!40000 ALTER TABLE `price_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_credentials`
--

DROP TABLE IF EXISTS `seller_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_credentials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(15) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `date_registered` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_id` (`unique_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `unique_id_2` (`unique_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_credentials`
--

LOCK TABLES `seller_credentials` WRITE;
/*!40000 ALTER TABLE `seller_credentials` DISABLE KEYS */;
INSERT INTO `seller_credentials` VALUES (1,'SELL-ZQ0Z5K','catherinegraceclosa@gmail.com','$2b$10$gXZiWpUua7Gce39iTDpxdeoIw1yMwkzbtqOaVZkdaKUmG1nIOJ6/.','2025-11-11 07:51:19'),(2,'SELL-GFGDHQ','kian@gmail.com','$2b$10$GC69jjr2p8Ty6LRtYmoGsexVtin8xPthi/s5KlTlTpy2MnYwBIhAy','2025-11-15 15:37:05'),(3,'SELL-7LED1Z','kian123@gmail.com','$2b$10$gXglwI4dKMRDl2tZrW68muNxqFX1Pz4z2l3q0mP8/3y4bKuXid2g.','2025-11-19 04:00:03'),(4,'SELL-7H8FD1','jean@gmail.com','$2b$10$hCT8NoekvrJ6kLGCm5p/8Oy1IJQJtq2LCS6W2RaMDJKA09HVLaSDy','2025-11-28 03:26:08');
/*!40000 ALTER TABLE `seller_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_notifications`
--

DROP TABLE IF EXISTS `seller_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_id` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','order','warning','success') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_seller_id` (`seller_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `seller_notifications_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_notifications`
--

LOCK TABLES `seller_notifications` WRITE;
/*!40000 ALTER TABLE `seller_notifications` DISABLE KEYS */;
INSERT INTO `seller_notifications` VALUES (1,'SELL-GFGDHQ','You have a new order (#14) from haha.','order',0,'2025-11-27 12:55:34'),(2,'SELL-GFGDHQ','You have a new order (#15) from cacacca.','order',0,'2025-11-27 17:02:53'),(3,'SELL-GFGDHQ','You have a new order (#16) from cath.','order',0,'2025-11-28 02:47:28'),(4,'SELL-GFGDHQ','You have a new order (#17) from cath.','order',0,'2025-11-28 04:04:20'),(5,'SELL-GFGDHQ','You have a new order (#18) from cath.','order',0,'2025-11-28 04:11:37'),(6,'SELL-GFGDHQ','You have a new order (#19) from kianportes.','order',0,'2025-11-28 05:54:14'),(7,'SELL-GFGDHQ','You have a new order (#20) from cath.','order',0,'2025-11-28 06:18:46'),(8,'SELL-GFGDHQ','You have a new order (#21) from Catherine Closa.','order',0,'2025-11-28 06:36:38'),(9,'SELL-GFGDHQ','You have a new order (#22) from Catherine Closa.','order',0,'2025-11-28 06:43:54'),(10,'SELL-GFGDHQ','You have a new order (#23) from Cath.','order',0,'2025-11-28 06:46:18'),(11,'SELL-GFGDHQ','You have a new order (#24) from Cath.','order',0,'2025-11-28 07:28:14'),(12,'SELL-GFGDHQ','You have a new order (#25) from Catherine Closa.','order',0,'2025-11-28 08:00:37'),(13,'SELL-GFGDHQ','You have a new order (#26) from Kian Andrei Portes.','order',0,'2025-11-28 08:17:17'),(14,'SELL-GFGDHQ','You have a new order (#27) from Kian Andrei Portes.','order',0,'2025-11-28 08:27:15'),(15,'SELL-GFGDHQ','You have a new order (#28) from Cath.','order',0,'2025-11-28 08:36:16'),(16,'SELL-GFGDHQ','You have a new order (#29) from Kian Andrei Portes.','order',0,'2025-11-28 08:49:25');
/*!40000 ALTER TABLE `seller_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_profiles`
--

DROP TABLE IF EXISTS `seller_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_id` varchar(50) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `qr` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seller_id` (`seller_id`),
  CONSTRAINT `fk_profile_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_profiles`
--

LOCK TABLES `seller_profiles` WRITE;
/*!40000 ALTER TABLE `seller_profiles` DISABLE KEYS */;
INSERT INTO `seller_profiles` VALUES (1,'SELL-GFGDHQ','/uploads/1763812068605-shop_logo.jpg','/uploads/1764261250759-backend-icon-design-free-vector.jpg','2025-11-22 11:29:06','2025-11-27 16:34:10'),(3,'SELL-7LED1Z','/uploads/1763954589043-shop_logo.jpg',NULL,'2025-11-24 03:23:09','2025-11-24 03:23:09');
/*!40000 ALTER TABLE `seller_profiles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-28 21:38:35
