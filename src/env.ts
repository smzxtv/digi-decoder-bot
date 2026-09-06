import type { Ai, D1Database, KVNamespace, Queue, R2Bucket } from '@cloudflare/workers-types';
import type { BotConfig } from './config';

/** 后台任务载荷 */
export type QueueJob =
  | { type: 'broadcast'; id: string; msgId: string; ids: number[]; text: string; parseMode?: string }
  | { type: 'notify'; chatId: number; text: string; parseMode?: string };

export interface Env {
  // ---- vars ----
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_USERNAME: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  /** 占位：优雅处理未配置的 ADMINS */
  DEFAULT_OWNER_ID?: string;
  ADMINS: string;
  TIME_ZONE_OFFSET_HOURS?: string;

  // ---- bindings ----
  DB: D1Database;
  KV: KVNamespace;
  R2_BUCKET?: R2Bucket;  // 可选：未配置时跳过备份
  AI: Ai;
  TASK_QUEUE: Queue<QueueJob>;

  // ---- 缓存配置（由 index.ts 启动时注入）----
}

export type ParseMode = 'HTML' | 'MarkdownV2' | undefined;

/** 解析逗号分隔的 ID 列表，转为 Set<number> */
export function parseAdmins(raw: string | undefined): Set<number> {
  const set = new Set<number>();
  for (const part of (raw ?? '').split(',')) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n > 0) set.add(n);
  }
  return set;
}

/** 是否为管理员（环境变量内的静态管理员） */
export function isStaticAdmin(env: Env, userId: number): boolean {
  if (String(env.DEFAULT_OWNER_ID ?? '') === String(userId)) return true;
  return parseAdmins(env.ADMINS).has(userId);
}

export function tzOffsetHours(env: Env): number {
  const n = Number(String(env.TIME_ZONE_OFFSET_HOURS ?? ''));
  return Number.isFinite(n) ? n : 8;
}