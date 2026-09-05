import type { Env } from './env';
import { makeCtx } from './ctx';
import { ensureUser } from './db';
import { checkBanStatus, rateLimit } from './middleware';
import { getConfig } from './config';
import { handleCallback } from './handlers/callbacks';
import { handleChatMemberEvent, handleNewMembers } from './handlers/welcome';
import { ALL_COMMANDS } from './handlers/adminCommands';
import { matchFaq } from './handlers/faq';
import { getPending, handleToolInput } from './handlers/tools';
import { cmdAI } from './handlers/aiChat';
import { handleAdblock } from './handlers/adblock';
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

  // 群成员变化（欢迎/移除）
  if (update.chat_member || update.my_chat_member) {
    await handleChatMemberEvent(ctx);
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

  // 兼容旧式 new_chat_members 入群消息
  if (msg.new_chat_members && msg.new_chat_members.length > 0) {
    await handleNewMembers(ctx);
    if (!msg.text && !msg.caption) return;
  }

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

  // 非命令消息
  if (ctx.isPrivate) {
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
    // 2) FAQ 关键词
    const faq = matchFaq(cfg, text);
    if (faq) {
      await ctx.reply(faq);
      return;
    }
    // 3) AI 兜底
    if (cfg.ai.enabled) {
      await cmdAI(ctx);
      return;
    }
    await ctx.reply('发送 /help 看看我能做什么 😊', {
      inlineKeyboard: [[btn('📖 打开帮助', 'hp:show')]],
    });
  } else if (ctx.isGroup) {
    // 群聊：先做广告过滤
    const isAd = await handleAdblock(ctx);
    if (isAd) return;

    const cfg = await getConfig(ctx.env);
    if (!text || text.length > cfg.limits.maxTextLen) return;
    const faq = matchFaq(cfg, text);
    if (faq) await ctx.reply(faq, { replyTo: true });
  }
}