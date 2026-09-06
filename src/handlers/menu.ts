import type { BotConfig } from '../config';
import type { UserRow } from '../db';
import { btn } from '../telegram';
import type { TgInlineKeyboardButton } from '../telegram-types';
import { esc, fmt } from '../utils/text';

export function mainMenuText(user: UserRow | null, cfg: BotConfig, rank: number): string {
  const uname = user ? esc(user.first_name ?? '') : '';
  const pname = cfg.brand.pointsName;
  return [
    `${cfg.brand.greeting}`,
    ``,
    `👤 ${uname || '新朋友'}${user?.username ? ` (@${esc(user.username)})` : ''}`,
    `💰 当前${pname}：<b>${fmt(user?.points ?? 0)}</b>　　🏅 排行：<b>#${fmt(rank)}</b>`,
    `📌 累计签到：<b>${fmt(user?.total_checkins ?? 0)}</b> 天`,
    ``,
    `从下方菜单选择功能吧 👇`,
  ].join('\n');
}

export function mainKeyboard(isAdmin: boolean, _registered = true): TgInlineKeyboardButton[][] {
  const lines: TgInlineKeyboardButton[][] = [
    [{ text: '📝 每日签到', callback_data: 'ck:show' }, { text: '🔥 签到排行', callback_data: 'pt:top' }],
    [{ text: '🧰 工具箱', callback_data: 'tl:show' }, { text: '📚 教程中心', callback_data: 'tu:show' }],
    [{ text: '🤖 AI 助手', callback_data: 'ai:show' }, { text: '🎁 幸运粉丝', callback_data: 'lk:show' }],
    [{ text: '🎁 邀请奖励', callback_data: 'in:me' }, { text: '❓ 帮助', callback_data: 'hp:show' }],
  ];
  if (isAdmin) lines.push([{ text: '⚙️ 管理面板', callback_data: 'ad:panel' }]);
  return lines;
}

/** 通用"返回主菜单"按钮 */
export function backMainBtn(): TgInlineKeyboardButton {
  return { text: '⬋ 返回主菜单', callback_data: 'menu:main' };
}
