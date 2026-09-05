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
    await ctx.reply('😀 用法：/ai 你的问题\n例如：/ai 帮我解释一下什么是 DNS', {
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
        `请确认已开通 Workers AI 额度并正确绑定模型。`
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
      `直接发送 <code>/ai 问题</code>，或回复某条消息说 <code>/ai</code>，即可让 AI 回答。`,
      ``,
      `当前模型：<code>${cfg.ai.model}</code>`,
      `频率限制：${cfg.ai.rateLimitPerMin}/分钟`,
    ].join('\n'),
    { inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]] }
  );
}

function splitAnswer(t: string): string {
  if (t.length <= 4000) return t;
  return t.slice(0, 3950) + '…';
}