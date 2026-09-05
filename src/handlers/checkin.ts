import type { Ctx } from '../ctx';
import { getConfig } from '../config';
import { addPoints, dbDoCheckin, getUser, localDate } from '../db';
import { tzOffsetHours } from '../env';
import { fmt } from '../utils/text';
import { btn } from '../telegram';

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
      { inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]] }
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

  await ctx.reply(text, { inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]] });
}