-- ============================================================
-- 数码解码机器人 · 初始 Schema
-- 应用方式: npx wrangler d1 migrations apply digi-decoder-db
-- ============================================================
PRAGMA journal_mode = WAL;

-- 用户
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY,           -- Telegram 用户 ID
  username        TEXT,
  first_name      TEXT,
  last_name       TEXT,
  language_code   TEXT,
  chat_id         INTEGER,                       -- 最近私聊的 chat id（用于私聊通知）
  points          INTEGER NOT NULL DEFAULT 0,    -- 积分
  is_admin        INTEGER NOT NULL DEFAULT 0,
  is_banned       INTEGER NOT NULL DEFAULT 0,
  inviter_id      INTEGER,                       -- 通过谁的邀请链接注册
  total_invites   INTEGER NOT NULL DEFAULT 0,    -- 累计邀请人数
  total_checkins  INTEGER NOT NULL DEFAULT 0,    -- 累计签到次数
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at      TEXT,
  last_active_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_points   ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_inviter  ON users(inviter_id);

-- 签到记录
CREATE TABLE IF NOT EXISTS checkins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  date       TEXT NOT NULL,                      -- YYYY-MM-DD（按配置时区）
  points     INTEGER NOT NULL DEFAULT 0,
  streak     INTEGER NOT NULL DEFAULT 0,         -- 当日签到后的连续天数
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date);

-- 邀请关系（每人只计首个邀请人）
CREATE TABLE IF NOT EXISTS invites (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id       INTEGER NOT NULL,
  invited_id       INTEGER NOT NULL UNIQUE,
  reward_inviter   INTEGER NOT NULL DEFAULT 0,
  reward_invited   INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  UNIQUE(invited_id, inviter_id)
);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);

-- 订单 / 兑换码
CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no   TEXT NOT NULL UNIQUE,               -- 兑换码
  user_id    INTEGER,                            -- 使用人
  item_type  TEXT NOT NULL DEFAULT 'points',
  amount     INTEGER NOT NULL DEFAULT 0,         -- 积分数量
  status     TEXT NOT NULL DEFAULT 'unused',     -- unused | used | revoked
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  used_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 教程中心
CREATE TABLE IF NOT EXISTS tutorials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT '其他',
  summary    TEXT DEFAULT '',
  content    TEXT NOT NULL,
  tags       TEXT DEFAULT '',
  published  INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  author_id  INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_tutorials_category ON tutorials(category);

-- 黑名单（用户级 / 群聊级）
CREATE TABLE IF NOT EXISTS blacklist (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type TEXT NOT NULL,                     -- 'user' | 'chat'
  target_id   INTEGER NOT NULL,
  reason      TEXT DEFAULT '',
  created_by  INTEGER,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  UNIQUE(target_type, target_id)
);