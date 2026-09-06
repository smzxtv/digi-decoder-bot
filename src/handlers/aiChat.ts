import type { Ctx } from '../ctx';
import { getConfig } from '../config';
import { rateLimit } from '../middleware';
import { btn } from '../telegram';
import { trunc } from '../utils/text';

/** AI 助手：/ai <文本> 或回复消息 */
export async function cmdAI(ctx: Ctx): Promise<void> {
  if (!ctx.from) return;
  const cfg = await getConfig(ctx.env);
  if (!cfg.ai.enabled) {
    await ctx.reply('AI 助手暂时关闭。');
    return;
  }

  let prompt = ctx.arg.trim();
  if (!prompt && ctx.message?.reply_to_message?.text) {
    prompt = ctx.message.reply_to_message.text.trim();
  }
  if (!prompt) {
    await ctx.reply('😀 用法：/ai 你的问题\n例如：/ai 帮我写一个快速排序', {
      inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]],
    });
    return;
  }
  prompt = trunc(prompt, 2000);

  const allowed = await rateLimit(ctx.env, 'ai', `u:${ctx.from.id}`, cfg.ai.rateLimitPerMin, 60);
  if (!allowed) {
    await ctx.reply('⏳ 请求太频繁啦，请稍后再试（每分钟 ' + cfg.ai.rateLimitPerMin + ' 次）。');
    return;
  }

  try {
    await ctx.bot.sendChatAction(ctx.chat!.id, 'typing');
    const res = (await ctx.env.AI.run(cfg.ai.model, {
      prompt: `${cfg.ai.promptSystem}\n\n用户问题：${prompt}\n\n回答：`,
      max_tokens: cfg.ai.maxTokens,
      temperature: 0.7,
    })) as { response?: string; output?: string };
    const answer = (res?.response ?? (res as Record<string, unknown>)?.output ?? '').toString().trim();
    if (!answer) throw new Error('模型未返回内容');
    await ctx.reply(splitAnswer(answer), {
      inlineKeyboard: [[btn('🧠 再问一个', 'ai:show'), btn('⬅ 返回主菜单', 'menu:main')]],
    });
  } catch (e) {
    await ctx.reply(
      `🤖 AI 调用失败：${e instanceof Error ? e.message : '未知错误'}\n` +
        `请稍后再试，若持续失败请联系管理员。`
    );
  }
}

/** AI 助手说明面板 */
export async function aiHelp(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  await ctx.reply(
    [
      `🤖 <b>AI 助手</b>`,
      ``,
      `支持四种模式：`,
      `　💬 AI 问答 — 科技 / 数码 / 网络问题`,
      `　👨‍💻 代码助手 — 编写 / 解释 / 调试代码`,
      `　✍️ 文案助手 — 撰写 / 润色文案`,
      `　📄 文本处理 — 翻译 / 总结 / 改写`,
      ``,
      `用法：发送 <code>/ai 你的问题</code>，或回复某条消息说 <code>/ai</code>。`,
      ``,
      `频率限制：${cfg.ai.rateLimitPerMin}/分钟`,
    ].join('\n'),
    { inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]] }
  );
}

/** 转义 Telegram 不支持的 HTML 标签，防止解析错误 */
function escapeUnsupportedTags(t: string): string {
  const allowed = /^(b|strong|i|em|u|ins|s|strike|del|span|a|code|pre)$/i;
  return t.replace(/<\/?([^\s>]+)[^>]*>/g, (match, tag) => {
    if (allowed.test(tag)) return match;
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });
}

function splitAnswer(t: string): string {
  const safe = escapeUnsupportedTags(t);
  if (safe.length <= 4000) return safe;
  return safe.slice(0, 3950) + '…';
}
