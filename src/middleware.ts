import type { Env } from './env';
import type { TgChat, TgUser } from './telegram-types';

/**
 * 滑动窗口速率限制（基于 KV）。
 * 返回 true 表示放行，false 表示超限。
 * scope 区分: cb(回调) / msg(消息) / welcome(欢迎) / ai
 */
export async function rateLimit(
  env: Env,
  scope: string,
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  if (limit <= 0) return true; // 0 表示不限
  const k = `rl:${scope}:${key}`;
  try {
    const raw = await env.KV.get(k);
    const now = Math.floor(Date.now() / 1000);
    if (!raw) {
      await env.KV.put(k, `${now}|1`, { expirationTtl: windowSec });
      return true;
    }
    const [startStr, countStr] = raw.split('|');
    const start = Number(startStr);
    const count = Number(countStr);
    if (now - start >= windowSec) {
      await env.KV.put(k, `${now}|1`, { expirationTtl: windowSec });
      return true;
    }
    if (count >= limit) return false;
    await env.KV.put(k, `${start}|${count + 1}`, { expirationTtl: windowSec - (now - start) });
    return true;
  } catch {
    return true; // KV 异常时放行，避免误伤
  }
}

/** 判断用户是否被拉黑（优先级：内存缓存太复杂，直接查 DB + KV 二级缓存） */
export async function isUserBanned(env: Env, userId: number): Promise<boolean> {
  const k = `ban:user:${userId}`;
  try {
    const cached = await env.KV.get(k);
    if (cached !== null) return cached === '1';
  } catch {
    /* ignore */
  }
  const row = await env.DB.prepare('SELECT id FROM blacklist WHERE target_type = ? AND target_id = ?')
    .bind('user', userId)
    .first();
  const banned = !!row;
  try {
    await env.KV.put(k, banned ? '1' : '0', { expirationTtl: 300 });
  } catch {
    /* ignore */
  }
  return banned;
}

export async function isChatBanned(env: Env, chatId: number): Promise<boolean> {
  const row = await env.DB.prepare('SELECT id FROM blacklist WHERE target_type = ? AND target_id = ?')
    .bind('chat', chatId)
    .first();
  return !!row;
}

/** 校验用户/群是否被 ban；返回 null 表示正常，否则返回冷却原因 */
export async function checkBanStatus(env: Env, user?: TgUser, chat?: TgChat): Promise<string | null> {
  if (user && (await isUserBanned(env, user.id))) return '你已被加入黑名单，无法使用机器人。';
  if (chat && chat.type !== 'private' && (await isChatBanned(env, chat.id)))
    return '本群已被管理员禁止使用机器人。';
  return null;
}