import type { Env } from './env';
import { makeCtx } from './ctx';
import { ensureUser } from './db';
import { checkBanStatus, rateLimit } from './middleware';
import { getConfig } from './config';
import { handleCallback } from './handlers/callbacks';
import { ALL_COMMANDS } from './handlers/adminCommands';
import { getPending, handleToolInput } from './handlers/tools';
import { cmdAI } from './handlers/aiChat';
import { btn } from './telegram';
import type { TgUpdate } from './telegram-types';

/** 机器人更新总入口 */
export async function handleUpdate(env: Env, update: TgUpdate): Promise<void> {
  // 幂等去重（Telegram webhook 最多重试一次）
  const dupeKey = `ud:${update.update_id}`;
  try {
    if ((await env.KV.get(dupeKey)) !== null) return;
    await env.KV.put(dupeKey, '1', { expirationTtl: 300 });
  } catch {
    /* 去重失败不阻塞 */
  }

  const ctx = makeCtx(env, update);

  // 忽略机器人和频道的消息
  if (update.message?.from?.is_bot) return;

  // 注册用户 & 更新活跃
  if (ctx.from) {
    try {
      await ensureUser(env.DB, ctx.from, ctx.chat?.id);
    } catch {
      /* 注册失败不影响处理 */
    }
  }

  // 黑白名单校验
  const banned = await checkBanStatus(env, ctx.from ?? undefined, ctx.chat ?? undefined);
  if (banned) {
    if (update.callback_query) {
      await ctx.answer();
      return;
    }
    if (ctx.isPrivate) await ctx.reply('🚫 ' + banned);
    return;
  }

  // 行内回调
  if (update.callback_query) {
    if (!ctx.from) return;
    const ok = await rateLimit(env, 'cb', `u:${ctx.from.id}`, 60, 60);
    if (!ok) {
      await ctx.answer('⏳ 操作太频繁，请稍后再试', true);
      return;
    }
    await handleCallback(ctx);
    return;
  }

  // 普通消息
  if (update.message) {
    await handleMessage(ctx);
  }
}

/** 普通消息路由 */
async function handleMessage(ctx: ReturnType<typeof makeCtx>): Promise<void> {
  const msg = ctx.message;
  if (!msg) return;

  const text = (msg.text ?? msg.caption ?? '').trim();

  // 命令路由
  if (text.startsWith('/')) {
    const first = text.split(/\s+/)[0];
    const name = first.split('@')[0].slice(1).toLowerCase();
    const cmd = ALL_COMMANDS[name];
    if (cmd) {
      await cmd(ctx);
      return;
    }
    await ctx.reply(`未知命令 <code>/${name}</code>，发送 /help 查看可用命令。`);
    return;
  }

  // 非命令消息（仅私聊处理）
  if (!ctx.isPrivate) return;

  // 1) 消费工具待处理输入
  if (ctx.from) {
    const pending = await getPending(ctx.env, ctx.from.id);
    if (pending && text) {
      await handleToolInput(ctx, text);
      return;
    }
  }
  if (!text) return;

  const cfg = await getConfig(ctx.env);
  if (text.length > cfg.limits.maxTextLen) {
    await ctx.reply('消息太长啦，请精简后重试（最多 ' + cfg.limits.maxTextLen + ' 字符）。');
    return;
  }
  // 2) AI 兜底
  if (cfg.ai.enabled) {
    await cmdAI(ctx);
    return;
  }
  await ctx.reply('发送 /help 看看我能做什么 😊', {
    inlineKeyboard: [[btn('📖 打开帮助', 'hp:show')]],
  });
}
