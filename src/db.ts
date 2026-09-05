import type { D1Database } from '@cloudflare/workers-types';
import type { TgUser } from './telegram-types';

/** 用户记录 */
export interface UserRow {
  id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  chat_id: number | null;
  points: number;
  is_admin: number;
  is_banned: number;
  inviter_id: number | null;
  total_invites: number;
  total_checkins: number;
  status: string;
  created_at: string;
  updated_at: string | null;
  last_active_at: string | null;
}

export interface TutorialRow {
  id: number;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string;
  published: number;
  view_count: number;
  author_id: number | null;
  created_at: string;
}

/** 确保用户存在并记录最近活跃信息；返回用户行 */
export async function ensureUser(
  db: D1Database,
  user: TgUser,
  chatId?: number
): Promise<UserRow> {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const existing = await getUser(db, user.id);
  if (existing) {
    await db
      .prepare(
        `UPDATE users SET
           username = ?, first_name = ?, last_name = ?, language_code = ?,
           chat_id = COALESCE(?, chat_id), last_active_at = ?
         WHERE id = ?`
      )
      .bind(user.username ?? null, user.first_name, user.last_name ?? null, user.language_code ?? null, chatId ?? null, now, user.id)
      .run();
    return (await getUser(db, user.id))!;
  }

  await db
    .prepare(
      `INSERT INTO users (id, username, first_name, last_name, language_code, chat_id, created_at, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(user.id, user.username ?? null, user.first_name, user.last_name ?? null, user.language_code ?? null, chatId ?? null, now, now)
    .run();
  return (await getUser(db, user.id))!;
}

export async function getUser(db: D1Database, id: number): Promise<UserRow | null> {
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  return row ?? null;
}

/** 增加（或扣减）积分，返回更新后用户 */
export async function addPoints(db: D1Database, id: number, delta: number): Promise<UserRow> {
  await db
    .prepare(
      `UPDATE users SET points = MAX(0, points + ?),
        updated_at = strftime('%Y-%m-%d %H:%M:%S','now') WHERE id = ?`
    )
    .bind(delta, id)
    .run();
  return (await getUser(db, id))!;
}

/** 排行榜名次（按积分降序） */
export async function getUserRank(db: D1Database, id: number): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS rank FROM users WHERE points > (SELECT points FROM users WHERE id = ?)')
    .bind(id)
    .first<{ rank: number }>();
  return (row?.rank ?? 0) + 1;
}

export async function getTop(db: D1Database, limit: number): Promise<UserRow[]> {
  const res = await db
    .prepare('SELECT * FROM users ORDER BY points DESC, total_checkins DESC LIMIT ?')
    .bind(limit)
    .all<UserRow>();
  return res.results ?? [];
}

// ---------------- 签到 ----------------

export async function hasCheckedToday(db: D1Database, userId: number, date: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT id FROM checkins WHERE user_id = ? AND date = ?')
    .bind(userId, date)
    .first();
  return !!row;
}

export interface CheckinResult {
  points: number;
  streak: number;
  bonus: number;
  firstTime: boolean;
}

/** 执行签到；返回奖励详情 */
export async function dbDoCheckin(
  db: D1Database,
  userId: number,
  date: string,
  baseReward: number
): Promise<CheckinResult> {
  if (await hasCheckedToday(db, userId, date)) {
    return { points: 0, streak: await getCurrentStreak(db, userId), bonus: 0, firstTime: false };
  }
  const prevStreak = await getCurrentStreak(db, userId);
  const streak = prevStreak + 1;
  await db
    .prepare('INSERT INTO checkins (user_id, date, points, streak) VALUES (?, ?, ?, ?)')
    .bind(userId, date, baseReward, streak)
    .run();
  await db
    .prepare(
      `UPDATE users SET points = points + ?, total_checkins = total_checkins + 1,
        updated_at = strftime('%Y-%m-%d %H:%M:%S','now') WHERE id = ?`
    )
    .bind(baseReward, userId)
    .run();
  return { points: baseReward, streak, bonus: 0, firstTime: true };
}

/** 计算当前连续签到天数（含今天；若今天未签则从昨天起算） */
export async function getCurrentStreak(db: D1Database, userId: number): Promise<number> {
  const ONE_DAY = 86400000;
  const today = new Date();
  const res = await db
    .prepare('SELECT date FROM checkins WHERE user_id = ? ORDER BY date DESC LIMIT 60')
    .bind(userId)
    .all<{ date: string }>();
  const dates = new Set((res.results ?? []).map((r) => r.date));

  let cursor = today;
  if (!dates.has(localDate(cursor))) cursor = new Date(today.getTime() - ONE_DAY);
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    if (dates.has(localDate(cursor))) {
      streak++;
      cursor = new Date(cursor.getTime() - ONE_DAY);
    } else break;
  }
  return streak;
}

/** 按本地时区取 YYYY-MM-DD */
export function localDate(d: Date = new Date(), tzOffsetHours = 8): string {
  return new Date(d.getTime() + tzOffsetHours * 3600000).toISOString().slice(0, 10);
}

// ---------------- 邀请 ----------------

export async function getInviter(db: D1Database, invitedId: number): Promise<number | null> {
  const row = await db
    .prepare('SELECT inviter_id FROM invites WHERE invited_id = ?')
    .bind(invitedId)
    .first<{ inviter_id: number }>();
  return row?.inviter_id ?? null;
}

/** 建立邀请关系（每人仅一次），返回是否首次 */
export async function registerInvite(
  db: D1Database,
  inviterId: number,
  invitedId: number,
  invitedReward: number,
  inviterReward: number
): Promise<'ok' | 'exists' | 'self'> {
  if (inviterId === invitedId) return 'self';
  if ((await getInviter(db, invitedId)) !== null) return 'exists';
  const inviter = await getUser(db, inviterId);
  if (!inviter || inviter.is_banned) return 'exists';

  await db.batch([
    db
      .prepare('INSERT INTO invites (inviter_id, invited_id, reward_inviter, reward_invited) VALUES (?, ?, ?, ?)')
      .bind(inviterId, invitedId, inviterReward, invitedReward),
    db.prepare('UPDATE users SET points = points + ?, inviter_id = ? WHERE id = ?').bind(invitedReward, inviterId, invitedId),
    db.prepare('UPDATE users SET points = points + ?, total_invites = total_invites + 1 WHERE id = ?').bind(inviterReward, inviterId),
  ]);
  return 'ok';
}

// ---------------- 兑换码（orders） ----------------

export async function createOrder(
  db: D1Database,
  orderNo: string,
  amount: number,
  createdBy: number
): Promise<void> {
  await db
    .prepare("INSERT INTO orders (order_no, item_type, amount, status, created_by) VALUES (?, 'points', ?, 'unused', ?)")
    .bind(orderNo, amount, createdBy)
    .run();
}

export async function redeemOrder(db: D1Database, userId: number, orderNo: string): Promise<'ok' | 'invalid' | 'used'> {
  const order = await db
    .prepare('SELECT * FROM orders WHERE order_no = ?')
    .bind(orderNo.trim().toUpperCase())
    .first<{ id: number; amount: number; status: string }>();
  if (!order) return 'invalid';
  if (order.status !== 'unused') return 'used';
  await db.batch([
    db.prepare("UPDATE orders SET status = 'used', user_id = ?, used_at = strftime('%Y-%m-%d %H:%M:%S','now') WHERE id = ?").bind(userId, order.id),
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').bind(order.amount, userId),
  ]);
  return 'ok';
}

// ---------------- 教程 ----------------

export async function listTutorialCategories(db: D1Database): Promise<string[]> {
  const res = await db
    .prepare('SELECT DISTINCT category FROM tutorials WHERE published = 1 ORDER BY category')
    .all<{ category: string }>();
  return (res.results ?? []).map((r) => r.category);
}

export async function listTutorials(db: D1Database, category?: string): Promise<TutorialRow[]> {
  const q = category
    ? 'SELECT * FROM tutorials WHERE published = 1 AND category = ? ORDER BY id DESC'
    : 'SELECT * FROM tutorials WHERE published = 1 ORDER BY id DESC';
  const res = await db.prepare(q).bind(category ?? null).all<TutorialRow>();
  return res.results ?? [];
}

export async function getTutorial(db: D1Database, id: number): Promise<TutorialRow | null> {
  const row = await db.prepare('SELECT * FROM tutorials WHERE id = ?').bind(id).first<TutorialRow>();
  if (row && row.published === 1) {
    await db.prepare('UPDATE tutorials SET view_count = view_count + 1 WHERE id = ?').bind(id).run();
  }
  return row ?? null;
}

export async function addTutorial(db: D1Database, t: { title: string; category: string; summary?: string; content: string; tags?: string; authorId?: number }): Promise<void> {
  await db
    .prepare('INSERT INTO tutorials (title, category, summary, content, tags, author_id) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(t.title, t.category, t.summary ?? '', t.content, t.tags ?? '', t.authorId ?? null)
    .run();
}

// ---------------- 黑名单 ----------------

export async function isBanned(db: D1Database, targetType: 'user' | 'chat', targetId: number): Promise<boolean> {
  const row = await db
    .prepare('SELECT id FROM blacklist WHERE target_type = ? AND target_id = ?')
    .bind(targetType, targetId)
    .first();
  return !!row;
}

export async function ban(db: D1Database, targetType: 'user' | 'chat', targetId: number, reason: string, byId: number): Promise<void> {
  await db
    .prepare('INSERT OR IGNORE INTO blacklist (target_type, target_id, reason, created_by) VALUES (?, ?, ?, ?)')
    .bind(targetType, targetId, reason, byId)
    .run();
  if (targetType === 'user') {
    await db.prepare('UPDATE users SET is_banned = 1 WHERE id = ?').bind(targetId).run();
  }
}

export async function unban(db: D1Database, targetType: 'user' | 'chat', targetId: number): Promise<void> {
  await db
    .prepare('DELETE FROM blacklist WHERE target_type = ? AND target_id = ?')
    .bind(targetType, targetId)
    .run();
  if (targetType === 'user') {
    await db.prepare('UPDATE users SET is_banned = 0 WHERE id = ?').bind(targetId).run();
  }
}

// ---------------- 统计 ----------------

export async function getStats(db: D1Database) {
  const users = await db.prepare('SELECT COUNT(*) AS n, SUM(points) AS pts FROM users').first<{ n: number; pts: number | null }>();
  const today = await db.prepare("SELECT COUNT(DISTINCT user_id) AS n FROM checkins WHERE date = date('now')").first<{ n: number }>();
  const orders = await db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS amt FROM orders WHERE status = 'unused'").first<{ n: number; amt: number }>();
  return {
    users: users?.n ?? 0,
    points: users?.pts ?? 0,
    todayCheckins: today?.n ?? 0,
    unusedOrders: orders?.n ?? 0,
    unusedPoints: orders?.amt ?? 0,
  };
}