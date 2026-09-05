import type { BotConfig } from '../config';

/** 关键词匹配 FAQ；命中返回回复文本，未命中返回 null */
export function matchFaq(cfg: BotConfig, text: string): string | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  for (const rule of cfg.faq) {
    for (const kw of rule.keywords) {
      const kl = kw.toLowerCase();
      const hit =
        rule.mode === 'exact'
          ? lower === kl
          : rule.mode === 'startsWith'
            ? lower.startsWith(kl)
            : !kl || lower.includes(kl);
      if (hit) return rule.reply;
    }
  }
  return null;
}

/** 构建 /faq 功能列表文本 */
export function faqListText(cfg: BotConfig): string {
  const lines = ['📌 常见问题（自动回复）', ''];
  for (const rule of cfg.faq) {
    const kws = rule.keywords.slice(0, 3).map((k) => `「${k}」`).join('、');
    lines.push(`🧩 ${kws}`);
    lines.push(`　↳ ${rule.reply.replace(/\n/g, '\n　↳ ')}`);
    lines.push('');
  }
  lines.push('直接在私聊中发送这些关键词即可触发，也可以输入 /help 查看更多。');
  return lines.join('\n');
}