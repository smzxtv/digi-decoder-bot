-- 幸运粉丝 v2：多活动管理
DROP TABLE IF EXISTS lucky_winners;

CREATE TABLE IF NOT EXISTS lucky_campaigns (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL DEFAULT '幸运粉丝抽奖',
  prize         TEXT NOT NULL,
  winners_count INTEGER NOT NULL DEFAULT 2,
  min_checkins  INTEGER NOT NULL DEFAULT 5,
  status        TEXT NOT NULL DEFAULT 'active',
  draw_month    TEXT,
  drawn_at      TEXT,
  created_by    INTEGER,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

CREATE TABLE IF NOT EXISTS lucky_winners (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  prize       TEXT NOT NULL DEFAULT '',
  shipped     INTEGER NOT NULL DEFAULT 0,
  ship_note   TEXT DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  UNIQUE(campaign_id, user_id)
);
