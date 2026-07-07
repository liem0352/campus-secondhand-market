-- 在 MySQL 中执行（命令行或 Navicat / Workbench）
-- mysql -u root -p < scripts/create_mysql_db.sql
--
-- 说明：原 family_finance 库已下线，业务整体改造为"校园二手交易平台"。
--       现统一使用 campus_market 库，脚本中保留对旧库的注释以备溯源。

CREATE DATABASE IF NOT EXISTS campus_market
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 如需单独建用户（可选，把密码改成你的）：
-- CREATE USER IF NOT EXISTS 'market_user'@'localhost' IDENTIFIED BY 'market_pass123';
-- GRANT ALL PRIVILEGES ON campus_market.* TO 'market_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ---- 旧库下线说明 ----
-- 原 SQL（已废弃，请勿执行）：
--   CREATE DATABASE IF NOT EXISTS family_finance
--     DEFAULT CHARACTER SET utf8mb4
--     COLLATE utf8mb4_unicode_ci;
-- 数据未做迁移（教学项目无生产数据），如确需回滚可手动建回 family_finance 库。
