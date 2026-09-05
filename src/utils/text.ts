import type { TgUser } from '../telegram-types';

/** 将文本切分为不超过 Telegram 上限（4000 字符）的多段 */
export function splitLong(text: string, max = 4000): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut <= 0) cut = max;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, '');
  }
  if (rest) parts.push(rest);
  return parts;
}

/** HTML 转义 */
export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 展示名：优先 username */
export function displayName(user?: TgUser | null): string {
  if (!user) return '未知用户';
  if (user.username) return `@${user.username}`;
  return user.first_name || '用户';
}

/** 展示名 + 可点击链接形式（用于欢迎语） */
export function mention(user: TgUser): string {
  if (user.username) return `@${user.username}`;
  const name = esc(user.first_name || '用户');
  return `<a href="tg://user?id=${user.id}">${name}</a>`;
}

/** 数字友好化（千分位） */
export function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/** 截断文本并附省略号 */
export function trunc(text: string, len = 200): string {
  return text.length > len ? text.slice(0, len) + '…' : text;
}

/** 简单 MarkdownV2 转义（仅转义保留字符） */
export function escMDv2(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}