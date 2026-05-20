-- ═══════════════════════════════════════════════════════════════════
--  RUPAIYA — Smart Daily Expense Tracker
--  database.sql  |  MySQL 8.0+
--  Complete schema: tables, constraints, sample data, SQL queries
-- ═══════════════════════════════════════════════════════════════════

-- ─── Create & select database ───────────────────────────────────────
CREATE DATABASE IF NOT EXISTS rupaiya_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rupaiya_db;

-- ════════════════════════════════════════
--  TABLE 1: users
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id         INT          UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ════════════════════════════════════════
--  TABLE 2: income
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS income (
  id         INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT           UNSIGNED NOT NULL,
  source     VARCHAR(150)  NOT NULL                        COMMENT 'e.g. Salary, Freelance',
  amount     DECIMAL(12,2) NOT NULL,
  date       DATE          NOT NULL,
  notes      TEXT          NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_income_user FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_income_amount CHECK (amount > 0),
  INDEX idx_income_user_date (user_id, date)
) ENGINE=InnoDB;

-- ════════════════════════════════════════
--  TABLE 3: expenses
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS expenses (
  id             INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT           UNSIGNED NOT NULL,
  title          VARCHAR(255)  NOT NULL,
  category       ENUM(
                   'Food','Shopping','Entertainment',
                   'Travel','Bills','Education',
                   'Health','Others'
                 ) NOT NULL DEFAULT 'Others',
  amount         DECIMAL(12,2) NOT NULL,
  payment_method ENUM('Cash','UPI','Card','Net Banking') NOT NULL DEFAULT 'Cash',
  notes          TEXT          NULL,
  date           DATE          NOT NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_expenses_user FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_expense_amount CHECK (amount > 0),
  INDEX idx_expenses_user_date     (user_id, date),
  INDEX idx_expenses_user_category (user_id, category),
  INDEX idx_expenses_date          (date)
) ENGINE=InnoDB;

-- ════════════════════════════════════════
--  TABLE 4: budgets
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS budgets (
  id               INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          INT           UNSIGNED NOT NULL,
  monthly_budget   DECIMAL(12,2) NOT NULL DEFAULT 30000.00,
  daily_limit      DECIMAL(12,2) NOT NULL DEFAULT  2000.00,
  warn_threshold   TINYINT       UNSIGNED NOT NULL DEFAULT 80  COMMENT 'Alert at X% spent',
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_budget_user (user_id),
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_budget_monthly  CHECK (monthly_budget > 0),
  CONSTRAINT chk_budget_daily    CHECK (daily_limit > 0),
  CONSTRAINT chk_budget_warn_pct CHECK (warn_threshold BETWEEN 1 AND 100)
) ENGINE=InnoDB;

-- ════════════════════════════════════════
--  SAMPLE DATA
-- ════════════════════════════════════════

INSERT IGNORE INTO users (id, name, email, password) VALUES
  (1, 'John Doe', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DxYG3m');

INSERT IGNORE INTO budgets (user_id, monthly_budget, daily_limit, warn_threshold) VALUES
  (1, 30000, 2000, 80);

-- Sample income
INSERT IGNORE INTO income (user_id, source, amount, date, notes) VALUES
  (1, 'Monthly Salary', 75000, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Net salary'),
  (1, 'Freelance Project', 15000, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Logo design');

-- Sample expenses
INSERT IGNORE INTO expenses (user_id, title, category, amount, payment_method, notes, date) VALUES
  (1, 'Swiggy Lunch', 'Food', 320, 'UPI', 'Biryani', CURDATE()),
  (1, 'Amazon Order', 'Shopping', 1840, 'Card', 'Earphones', CURDATE()),
  (1, 'Netflix Subscription', 'Entertainment', 649, 'Card', '', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
  (1, 'Ola Cab', 'Travel', 280, 'UPI', 'Office commute', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
  (1, 'BESCOM Bill', 'Bills', 1200, 'Net Banking', 'Electricity', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
  (1, 'Udemy Course', 'Education', 499, 'Card', 'React JS', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
  (1, 'Pharmacy', 'Health', 450, 'Cash', 'Monthly meds', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
  (1, 'Myntra Haul', 'Shopping', 2700, 'Card', 'Clothes', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
  (1, 'Weekend Movie', 'Entertainment', 600, 'UPI', '', DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
  (1, 'Grocery Run', 'Food', 1800, 'Cash', 'Big Bazaar', DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
  (1, 'Train Ticket', 'Travel', 920, 'Net Banking', 'Bangalore-Mysore', DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
  (1, 'Mobile Recharge', 'Bills', 399, 'UPI', 'Jio', DATE_SUB(CURDATE(), INTERVAL 20 DAY));
