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

-- Users (password = 'password123' bcrypt hash placeholder)
INSERT INTO users (name, email, password) VALUES
  ('John Doe',    'john@example.com',   '$2b$12$exampleHashForJohnDoe123456'),
  ('Priya Sharma','priya@example.com',  '$2b$12$exampleHashForPriyaSharma789'),
  ('Rahul Verma', 'rahul@example.com',  '$2b$12$exampleHashForRahulVerma456');

-- Budgets for each user
INSERT INTO budgets (user_id, monthly_budget, daily_limit, warn_threshold) VALUES
  (1, 35000.00, 2000.00, 80),
  (2, 50000.00, 2500.00, 75),
  (3, 25000.00, 1500.00, 85);

-- Income entries
INSERT INTO income (user_id, source, amount, date, notes) VALUES
  (1, 'Monthly Salary',    75000.00, CURDATE() - INTERVAL 20 DAY, 'Net in-hand after tax'),
  (1, 'Freelance Project', 15000.00, CURDATE() - INTERVAL 10 DAY, 'Logo design for startup'),
  (2, 'Monthly Salary',    90000.00, CURDATE() - INTERVAL 18 DAY, 'Product manager salary'),
  (2, 'Dividend Income',    5000.00, CURDATE() - INTERVAL  5 DAY, 'Quarterly dividend'),
  (3, 'Monthly Salary',    55000.00, CURDATE() - INTERVAL 22 DAY, 'Software engineer'),
  (3, 'Tutoring',           8000.00, CURDATE() - INTERVAL  8 DAY, 'Weekend classes');

-- Expenses
INSERT INTO expenses (user_id, title, category, amount, payment_method, notes, date) VALUES
  -- John Doe (user 1)
  (1, 'Swiggy Lunch',          'Food',          320.00,  'UPI',         'Chicken Biryani',        CURDATE()),
  (1, 'Amazon Order',          'Shopping',     1840.00,  'Card',        'Wireless earphones',     CURDATE()),
  (1, 'Netflix Subscription',  'Entertainment', 649.00,  'Card',        '',                       CURDATE() - INTERVAL  1 DAY),
  (1, 'Ola Cab',               'Travel',        280.00,  'UPI',         'Office commute',         CURDATE() - INTERVAL  1 DAY),
  (1, 'BESCOM Electricity',    'Bills',        1200.00,  'Net Banking', 'Monthly electricity bill',CURDATE() - INTERVAL  2 DAY),
  (1, 'Udemy Course',          'Education',     499.00,  'Card',        'React & TypeScript',     CURDATE() - INTERVAL  2 DAY),
  (1, 'Pharmacy',              'Health',        450.00,  'Cash',        'Monthly medicines',      CURDATE() - INTERVAL  5 DAY),
  (1, 'Myntra Haul',           'Shopping',     2700.00,  'Card',        'Summer collection',      CURDATE() - INTERVAL  5 DAY),
  (1, 'Weekend Movie Tickets', 'Entertainment', 600.00,  'UPI',         'PVR Gold',               CURDATE() - INTERVAL 10 DAY),
  (1, 'Big Bazaar Grocery',    'Food',         1800.00,  'Cash',        'Monthly groceries',      CURDATE() - INTERVAL 10 DAY),
  (1, 'Train Ticket',          'Travel',        920.00,  'Net Banking', 'Bangalore → Mysore',     CURDATE() - INTERVAL 20 DAY),
  (1, 'Jio Recharge',          'Bills',         399.00,  'UPI',         '84-day plan',            CURDATE() - INTERVAL 20 DAY),

  -- Priya Sharma (user 2)
  (2, 'Zomato Dinner',         'Food',          560.00,  'UPI',         '',                       CURDATE()),
  (2, 'Nykaa Order',           'Shopping',     3200.00,  'Card',        'Skincare products',      CURDATE() - INTERVAL  2 DAY),
  (2, 'Spotify Premium',       'Entertainment', 119.00,  'Card',        '',                       CURDATE() - INTERVAL  3 DAY),
  (2, 'Doctor Consultation',   'Health',        800.00,  'Cash',        'General checkup',        CURDATE() - INTERVAL  7 DAY),
  (2, 'Petrol',                'Travel',        900.00,  'UPI',         'Full tank',              CURDATE() - INTERVAL  7 DAY),

  -- Rahul Verma (user 3)
  (3, 'Dominos Pizza',         'Food',          450.00,  'UPI',         '',                       CURDATE()),
  (3, 'Gaming Mouse',          'Shopping',     1600.00,  'Card',        'Logitech G502',          CURDATE() - INTERVAL  1 DAY),
  (3, 'Steam Games',           'Entertainment',1800.00,  'Card',        'Sale purchases',         CURDATE() - INTERVAL  3 DAY);


-- ════════════════════════════════════════
--  ANALYTICAL SQL QUERIES
-- ════════════════════════════════════════

-- ─── Q1: Total income per user (all time) ───────────────────────────
SELECT
  u.id         AS user_id,
  u.name       AS user_name,
  COALESCE(SUM(i.amount), 0) AS total_income
FROM users u
LEFT JOIN income i ON i.user_id = u.id
GROUP BY u.id, u.name
ORDER BY total_income DESC;

-- ─── Q2: Total expenses per user (all time) ─────────────────────────
SELECT
  u.id         AS user_id,
  u.name       AS user_name,
  COALESCE(SUM(e.amount), 0) AS total_expenses
FROM users u
LEFT JOIN expenses e ON e.user_id = u.id
GROUP BY u.id, u.name
ORDER BY total_expenses DESC;

-- ─── Q3: Monthly spending summary (for a specific user) ─────────────
-- Replace 1 with the desired user_id
SELECT
  DATE_FORMAT(date, '%Y-%m')            AS month,
  COUNT(*)                              AS num_transactions,
  ROUND(SUM(amount), 2)                 AS total_spent,
  ROUND(AVG(amount), 2)                 AS avg_per_transaction,
  ROUND(MAX(amount), 2)                 AS largest_expense
FROM expenses
WHERE user_id = 1
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month DESC
LIMIT 12;

-- ─── Q4: Category-wise expense breakdown ────────────────────────────
SELECT
  category,
  COUNT(*)                                         AS num_transactions,
  ROUND(SUM(amount), 2)                            AS total_amount,
  ROUND(SUM(amount) * 100.0 / SUM(SUM(amount)) OVER(), 1) AS pct_of_total
FROM expenses
WHERE user_id = 1
  AND DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
GROUP BY category
ORDER BY total_amount DESC;

-- ─── Q5: Daily spending for the current month ───────────────────────
SELECT
  date                        AS expense_date,
  COUNT(*)                    AS num_transactions,
  ROUND(SUM(amount), 2)       AS daily_total
FROM expenses
WHERE user_id = 1
  AND YEAR(date)  = YEAR(CURDATE())
  AND MONTH(date) = MONTH(CURDATE())
GROUP BY date
ORDER BY date DESC;

-- ─── Q6: Budget exceeded detection ──────────────────────────────────
-- Returns users who have exceeded their monthly budget this month
SELECT
  u.name                                   AS user_name,
  b.monthly_budget                         AS budget_limit,
  ROUND(SUM(e.amount), 2)                  AS total_spent,
  ROUND(SUM(e.amount) - b.monthly_budget, 2) AS over_by,
  ROUND(SUM(e.amount) / b.monthly_budget * 100, 1) AS pct_used
FROM users u
JOIN budgets  b ON b.user_id = u.id
JOIN expenses e ON e.user_id = u.id
  AND YEAR(e.date)  = YEAR(CURDATE())
  AND MONTH(e.date) = MONTH(CURDATE())
GROUP BY u.id, u.name, b.monthly_budget
HAVING total_spent > b.monthly_budget
ORDER BY over_by DESC;

-- ─── Q7: Users near budget threshold ────────────────────────────────
SELECT
  u.name,
  b.monthly_budget                                   AS budget,
  b.warn_threshold                                   AS warn_at_pct,
  ROUND(SUM(e.amount), 2)                            AS spent,
  ROUND(SUM(e.amount) / b.monthly_budget * 100, 1)  AS pct_used
FROM users u
JOIN budgets  b ON b.user_id = u.id
JOIN expenses e ON e.user_id = u.id
  AND YEAR(e.date)  = YEAR(CURDATE())
  AND MONTH(e.date) = MONTH(CURDATE())
GROUP BY u.id, u.name, b.monthly_budget, b.warn_threshold
HAVING pct_used >= b.warn_threshold
ORDER BY pct_used DESC;

-- ─── Q8: Unnecessary spending alert ─────────────────────────────────
-- Shopping + Entertainment > 40% of user's monthly income
SELECT
  u.name,
  ROUND(monthly_income.total, 2)        AS monthly_income,
  ROUND(unnecessary.total, 2)           AS unnecessary_spend,
  ROUND(unnecessary.total / monthly_income.total * 100, 1) AS pct_of_income
FROM users u
JOIN (
  SELECT user_id, SUM(amount) AS total
  FROM income
  WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())
  GROUP BY user_id
) monthly_income ON monthly_income.user_id = u.id
JOIN (
  SELECT user_id, SUM(amount) AS total
  FROM expenses
  WHERE category IN ('Shopping','Entertainment')
    AND YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())
  GROUP BY user_id
) unnecessary ON unnecessary.user_id = u.id
WHERE unnecessary.total / monthly_income.total > 0.40
ORDER BY pct_of_income DESC;

-- ─── Q9: Top 5 highest expenses this month ──────────────────────────
SELECT
  id, title, category, amount, date, payment_method
FROM expenses
WHERE user_id = 1
  AND YEAR(date)  = YEAR(CURDATE())
  AND MONTH(date) = MONTH(CURDATE())
ORDER BY amount DESC
LIMIT 5;

-- ─── Q10: Net savings per month (income − expenses) ─────────────────
SELECT
  inc.month,
  ROUND(inc.income_total, 2)                     AS total_income,
  ROUND(COALESCE(exp.expense_total, 0), 2)       AS total_expenses,
  ROUND(inc.income_total - COALESCE(exp.expense_total, 0), 2) AS net_savings,
  ROUND((inc.income_total - COALESCE(exp.expense_total, 0))
        / inc.income_total * 100, 1)             AS savings_rate_pct
FROM (
  SELECT user_id, DATE_FORMAT(date, '%Y-%m') AS month, SUM(amount) AS income_total
  FROM income WHERE user_id = 1 GROUP BY user_id, month
) inc
LEFT JOIN (
  SELECT user_id, DATE_FORMAT(date, '%Y-%m') AS month, SUM(amount) AS expense_total
  FROM expenses WHERE user_id = 1 GROUP BY user_id, month
) exp ON exp.user_id = inc.user_id AND exp.month = inc.month
ORDER BY inc.month DESC
LIMIT 12;

-- ─── Q11: Today's expenses vs daily limit ───────────────────────────
SELECT
  ROUND(SUM(e.amount), 2)   AS today_spent,
  b.daily_limit,
  ROUND(SUM(e.amount) / b.daily_limit * 100, 1) AS pct_of_daily_limit,
  CASE
    WHEN SUM(e.amount) > b.daily_limit         THEN 'EXCEEDED'
    WHEN SUM(e.amount) > b.daily_limit * 0.80  THEN 'NEAR_LIMIT'
    ELSE 'OK'
  END AS status
FROM expenses e
JOIN budgets b ON b.user_id = e.user_id
WHERE e.user_id = 1
  AND e.date = CURDATE()
GROUP BY b.daily_limit;

-- ─── Q12: Payment method usage ──────────────────────────────────────
SELECT
  payment_method,
  COUNT(*) AS num_transactions,
  ROUND(SUM(amount), 2) AS total_amount
FROM expenses
WHERE user_id = 1
GROUP BY payment_method
ORDER BY total_amount DESC;

-- ─── Q13: Full balance sheet for a user ─────────────────────────────
SELECT
  'Income'   AS type,
  source     AS description,
  amount,
  date
FROM income WHERE user_id = 1
UNION ALL
SELECT
  'Expense'  AS type,
  CONCAT(title, ' (', category, ')') AS description,
  -amount    AS amount,
  date
FROM expenses WHERE user_id = 1
ORDER BY date DESC, type;

-- ─── Q14: Search expenses by keyword ────────────────────────────────
-- Replace 'groceries' with any search term
SELECT id, title, category, amount, date, notes
FROM expenses
WHERE user_id = 1
  AND (
    title LIKE '%groceries%'
    OR notes LIKE '%groceries%'
  )
ORDER BY date DESC;

-- ═══════════════════════════════════════════════════════════════════
--  END OF database.sql
-- ═══════════════════════════════════════════════════════════════════