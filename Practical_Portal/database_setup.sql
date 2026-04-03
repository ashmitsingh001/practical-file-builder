-- 🚀 Java Practical Cloud Database Setup
-- Run this script in your InfinityFree phpMyAdmin

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Practicals Table (Multi-Version Storage)
CREATE TABLE IF NOT EXISTS `practicals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `version_name` VARCHAR(100) NOT NULL,
  `html_content` LONGTEXT NOT NULL,
  `theme` VARCHAR(50) DEFAULT 'default',
  `zoom` FLOAT DEFAULT 1.0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
