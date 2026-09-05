import type { Ctx } from '../ctx';
import type { BotConfig } from '../config';

/**
 * 检测文本是否包含广告关键词
 * @returns 命中的关键词，未命中返回 null
 */
export function matchAdKeyword(cfg: BotConfig['adblock'], text: string): string | null {
  if (!cfg.enabled || !cfg.keywords.length) return null;
  const lower = text.toLowerCase();
  for (const kw of cfg.keywords) {
    if (kw && lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

/**
 * 处理群聊广告检测
 * @returns true = 是广告（已处理），false = 正常消息
 */
export async function handleAdblock(ctx: Ctx): Promise<boolean> {
  const cfg = ctx.env.AD_BLOCK_CFG;
  if (!cfg?.enabled || !ctx.message || !ctx.from) return false;

  // 管理员豁免
  if (cfg.adminBypass && ctx.isAdmin) return false;

  const text = ctx.message.text ?? ctx.message.caption ?? '';
  if (!text) return false;

  const matched = matchAdKeyword(cfg, text);
  if (!matched) return false;

  // 删除广告消息
  try {
    await ctx.bot.deleteMessage(ctx.chat!.id, ctx.message.message_id);
  } catch {
    /* 可能无权限，忽略 */
  }

  // 删除并拉黑
  if (cfg.action === 'delete_and_ban') {
    try {
      await ctx.bot.callSafe('kickChatMember', {
        chat_id: ctx.chat!.id,
        user_id: ctx.from.id,
      });
    } catch {
      /* 忽略 */
    }
  }

  // 发送警告（可选）
  try {
    await ctx.bot.sendMessage(
      ctx.chat!.id,
      `🚫 检测到广告关键词「${matched}」，消息已删除。`,
    );
  } catch {
    /* 忽略 */
  }

  return true;
}
