import type { Ctx } from '../ctx';
import { getConfig } from '../config';
import { rateLimit } from '../middleware';
import { displayName, mention } from '../utils/text';

/**
 * 处理 chat_member / my_chat_member 更新：
 * 新人加入群聊 -> 自动欢迎；机器人被加入 -> 打招呼；成员离开 -> 按配置忽略或提示。
 */
export async function handleChatMemberEvent(ctx: Ctx): Promise<void> {
  const upd = ctx.update;
  const memUpd = upd.chat_member ?? upd.my_chat_member;
  if (!memUpd || !ctx.chat) return;

  const { chat, new_chat_member: ncm, old_chat_member: ocm } = memUpd;
  const target = ncm?.user;
  if (!target || !chat) return;

  const joined = ncm.status === 'member' && ocm.status !== 'member';
  const left = ['left', 'kicked'].includes(ncm.status) && !['left', 'kicked'].includes(ocm.status);

  if (!joined) return;

  const cfg = await getConfig(ctx.env);
  if (!cfg.welcome.enabled) return;

  // 自己（bot）被拉进群：发送引导消息
  if (target.is_bot) {
    if (String(target.id) === String(ctx.env.TELEGRAM_BOT_TOKEN.split(':')[0])) {
      await ctx.bot.sendMessage(chat.id, '👋 大家好，我是数码解码工具站！\n输入 /help 查看我的能力。');
    }
    return;
  }

  // 群欢迎（防刷：每群限频）
  const allowed = await rateLimit(ctx.env, 'welcome', `chat:${chat.id}`, 2, 10);
  if (!allowed) return;

  const template = cfg.welcome.text;
  const text = template
    .replace('{name}', displayName(target))
    .replace('{chat}', chat.title ? escapeHtml(chat.title) : '本群')
    .replace('{id}', String(target.id));

  await ctx.bot.sendMessage(chat.id, text, {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
  void left;
}

/** 兼容旧式 message.new_chat_members 字段（可选删除系统消息） */
export async function handleNewMembers(ctx: Ctx): Promise<void> {
  const msg = ctx.message;
  const members = msg?.new_chat_members;
  if (!members || members.length === 0 || !ctx.chat) return;

  const cfg = await getConfig(ctx.env);

  // 删除入群/退群系统消息（可选）
  if (cfg.welcome.deleteSystemMessages) {
    await ctx.bot.deleteMessage(ctx.chat.id, msg.message_id);
  }
  if (!cfg.welcome.enabled || ctx.chat.type === 'private') return;
  if (msg.from?.is_bot) return;

  const allowed = await rateLimit(ctx.env, 'welcome', `chat:${ctx.chat.id}`, 2, 10);
  if (!allowed) return;

  for (const m of members) {
    if (m.is_bot) continue;
    const template = cfg.welcome.text;
    const text = template
      .replace('{name}', `${mention(m)}`)
      .replace('{chat}', ctx.chat.title ? escapeHtml(ctx.chat.title) : '本群')
      .replace('{id}', String(m.id));
    await ctx.bot.sendMessage(ctx.chat.id, text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    break; // 一次仅欢迎一个，避免刷屏
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}