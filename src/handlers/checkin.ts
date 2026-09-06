import type { Ctx } from '../ctx';
import { getConfig } from '../config';
import { addPoints, dbDoCheckin, getUser, localDate, monthCheckinCount } from '../db';
import { tzOffsetHours } from '../env';
import { fmt } from '../utils/text';
import { btn } from '../telegram';
import { cmdTop } from './points';

/** 签到子菜单（今日签到 / 连续签到 / 本月签到 / 签到排行榜） */
export async function checkinHome(ctx: Ctx): Promise<void> {
  if (!ctx.from) return;
  const cfg = await getConfig(ctx.env);
  const tz = tzOffsetHours(ctx.env);
  const user = await getUser(ctx.env.DB, ctx.from.id);
  const month = localDate(new Date(), tz).slice(0, 7);
  const monthCount = await monthCheckinCount(ctx.env.DB, ctx.from.id, month);

  const text = [
    `📝 <b>每日签到</b>`,
    ``,
    `🔥 连续签到：<b>${fmt(user?.total_checkins ?? 0)}</b> 天（累计）`,
    `📅 本月签到：<b>${fmt(monthCount)}</b> 天`,
    `💰 当前${cfg.brand.pointsName}：<b>${fmt(user?.points ?? 0)}</b>`,
    ``,
    `🎁 连签奖励：` + cfg.checkin.streakBonuses.map((s) => `${s.days}天+${s.points}`).join('，'),
    `🎟 本月签到满 5 天可参与「幸运粉丝」抽奖`,
  ].join('\n');

  await ctx.reply(text, {
    inlineKeyboard: [
      [btn('✅ 今日签到', 'ck:do'), btn('📅 本月签到', 'ck:month')],
      [btn('🔥 签到排行榜', 'pt:top'), btn('🎁 幸运粉丝', 'lk:show')],
      [btn('⬅ 返回主菜单', 'menu:main')],
    ],
  });
}

/** 本月签到日历明细 */
export async function checkinMonth(ctx: Ctx): Promise<void> {
  if (!ctx.from) return;
  const tz = tzOffsetHours(ctx.env);
  const today = localDate(new Date(), tz);
  const month = today.slice(0, 7);
  const days = await getMonthCheckinDays(ctx.env.DB, ctx.from.id, month);
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const set = new Set(days);
  const cells: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = `${month}-${String(d).padStart(2, '0')}`;
    if (set.has(dd)) cells.push('✅');
    else if (dd > today) cells.push('▫️');
    else cells.push('·');
    if (d % 7 === 0) cells.push('\n');
  }
  await ctx.reply(
    [`📅 <b>${month} 签到记录</b>（共 ${days.length} 天）`, '', cells.join(' ')].join('\n'),
    { inlineKeyboard: [[btn('✅ 今日签到', 'ck:do'), btn('⬅ 返回', 'ck:show')]] }
  );
}

async function getMonthCheckinDays(db: import('@cloudflare/workers-types').D1Database, userId: number, month: string): Promise<string[]> {
  const res = await db
    .prepare('SELECT date FROM checkins WHERE user_id = ? AND substr(date, 1, 7) = ? ORDER BY date')
    .bind(userId, month)
    .all<{ date: string }>();
  return (res.results ?? []).map((r) => r.date);
}

/** 执行签到（命令 /checkin 与 回调 ck:do 共用） */
export async function doCheckin(ctx: Ctx): Promise<void> {
  if (!ctx.from || !ctx.chat) return;
  if (!ctx.isPrivate) {
    await ctx.reply('💡 签到请在私聊中完成哦（发送 /checkin）。');
    return;
  }
  const cfg = await getConfig(ctx.env);
  if (!cfg.checkin.enabled) {
    await ctx.reply('签到功能暂时关闭，敬请期待。');
    return;
  }

  const tz = tzOffsetHours(ctx.env);
  const date = localDate(new Date(), tz);
  const res = await dbDoCheckin(ctx.env.DB, ctx.from.id, date, cfg.checkin.rewardPoints);

  if (!res.firstTime) {
    const user = await getUser(ctx.env.DB, ctx.from.id);
    await ctx.reply(
      `😴 今天已经签到过了哦（已连续 <b>${res.streak}</b> 天）\n` +
        `明天再来吧～ 当前${cfg.brand.pointsName}：<b>${fmt(user?.points ?? 0)}</b>`,
      { inlineKeyboard: [[btn('📅 本月签到', 'ck:month'), btn('⬅ 返回主菜单', 'menu:main')]] }
    );
    return;
  }

  // 多级里程碑奖励：达成对应连续天数当天一次性发放
  let bonus = 0;
  let milestoneDays = 0;
  for (const sb of cfg.checkin.streakBonuses) {
    if (res.streak === sb.days) {
      bonus = sb.points;
      milestoneDays = sb.days;
      break;
    }
  }
  if (bonus > 0) {
    await addPoints(ctx.env.DB, ctx.from.id, bonus);
  }
  const user = await getUser(ctx.env.DB, ctx.from.id);

  const nextBonus = cfg.checkin.streakBonuses.find((sb) => sb.days > res.streak);
  const text = [
    `✅ 签到成功！`,
    ``,
    `🔥 已连续签到 <b>${res.streak}</b> 天`,
    `💰 获得 ${cfg.brand.pointsName}：<b>+${res.points}</b>${bonus ? `　🎁 里程碑奖励 <b>+${bonus}</b>` : ''}`,
    `📊 当前${cfg.brand.pointsName}：<b>${fmt(user?.points ?? 0)}</b>`,
    bonus
      ? `\n🎉 恭喜达成连续 ${milestoneDays} 天里程碑，额外获得 ${bonus} ${cfg.brand.pointsName}！`
      : nextBonus
        ? `\n继续坚持，连续 ${nextBonus.days} 天可再领 ${nextBonus.points} ${cfg.brand.pointsName}！`
        : `\n已达成全部签到里程碑，继续保持好习惯！`,
  ].join('\n');

  await ctx.reply(text, { inlineKeyboard: [[btn('📅 本月签到', 'ck:month'), btn('⬅ 返回主菜单', 'menu:main')]] });
}

// 让 cmdTop 可从本模块复用（签到排行按钮已指向 pt:top）
void cmdTop;
