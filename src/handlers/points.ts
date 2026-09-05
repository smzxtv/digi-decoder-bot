import type { Ctx } from '../ctx';
import { getConfig } from '../config';
import { getTop, getUser, getUserRank, redeemOrder } from '../db';
import { btn } from '../telegram';
import { esc, fmt } from '../utils/text';

/** /me 我的积分 */
export async function cmdMe(ctx: Ctx): Promise<void> {
  if (!ctx.from) return;
  const cfg = await getConfig(ctx.env);
  const [user, rank] = await Promise.all([
    getUser(ctx.env.DB, ctx.from.id),
    getUserRank(ctx.env.DB, ctx.from.id),
  ]);
  if (!user) {
    await ctx.reply('请先发送 /start 注册。');
    return;
  }
  const pname = cfg.brand.pointsName;
  const preset = ctx.isOwner ? '👑 群主' : '';
  const text = [
    `👤 <b>${esc(user.first_name ?? '')}</b>${user.username ? ` (@${esc(user.username)})` : ''} ${preset}`,
    ``,
    `💰 当前${pname}：<b>${fmt(user.points)}</b>`,
    `🏅 全站排行：<b>#${fmt(rank)}</b>`,
    `📌 累计签到：<b>${fmt(user.total_checkins)}</b> 天`,
    `👥 累计邀请：<b>${fmt(user.total_invites)}</b> 人`,
    `🗓️ 注册时间：${user.created_at}`,
  ].join('\n');
  await ctx.reply(text, {
    inlineKeyboard: [
      [btn('📝 签到', 'ck:do'), btn('🔥 排行榜', 'pt:top')],
      [btn('⬅ 返回主菜单', 'menu:main')],
    ],
  });
}

/** /top 积分排行榜 */
export async function cmdTop(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  const rows = await getTop(ctx.env.DB, cfg.top.limit);
  if (rows.length === 0) {
    await ctx.reply('暂无用户数据，快去邀请朋友来玩吧！', {
      inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]],
    });
    return;
  }
  const medals = ['🥇', '🥈', '🥉'];
  const lines = rows.map((u, i) => {
    const medal = medals[i] ?? `${i + 1}.`;
    const name = u.username ? `@${esc(u.username)}` : esc(u.first_name ?? '用户');
    const flam = !!ctx.from && u.id === ctx.from.id;
    const mark = flam ? ' ◀️' : '';
    return `${medal} <b>${name}</b>${mark}\n　💰 ${fmt(u.points)} ${cfg.brand.pointsName} · 签到 ${fmt(u.total_checkins)} 天`;
  });
  const self = ctx.from ? await getUser(ctx.env.DB, ctx.from.id) : null;
  const selfRank = ctx.from ? await getUserRank(ctx.env.DB, ctx.from.id) : 0;
  const text = [
    `🔥 <b>${cfg.brand.pointsName}排行榜 TOP ${cfg.top.limit}</b>`,
    ``,
    ...lines,
    self ? `\n……\n你的排名：<b>#${fmt(selfRank)}</b>（${fmt(self.points)} ${cfg.brand.pointsName}）` : '',
  ].join('\n');
  await ctx.reply(text, {
    inlineKeyboard: [[btn('🔄 刷新', 'pt:top'), btn('⬅ 返回主菜单', 'menu:main')]],
  });
}

/** /invite 邀请奖励 */
export async function cmdInvite(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  const username = ctx.env.TELEGRAM_BOT_USERNAME;
  if (!username) {
    await ctx.reply('机器人用户名尚未配置，请联系管理员。');
    return;
  }
  const link = `https://t.me/${username}?start=ref_${ctx.from!.id}`;
  const text = [
    `🎁 <b>邀请好友赚${cfg.brand.pointsName}</b>`,
    ``,
    `邀请新用户通过你的链接注册，双方都有奖励：`,
    `　✅ 被邀请人：+${cfg.invite.invitedReward}`,
    `　✅ 邀请人：+${cfg.invite.inviterReward}`,
    ``,
    `👇 你的专属邀请链接（点击复制）：`,
    `<code>${link}</code>`,
  ].join('\n');
  await ctx.reply(text, {
    inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]],
  });
}

/** /redeem 使用兑换码 */
export async function cmdRedeem(ctx: Ctx): Promise<void> {
  if (!ctx.from) return;
  const code = ctx.arg.trim();
  if (!code) {
    await ctx.reply('用法：/redeem <兑换码>\n在管理员处获得兑换码后使用。');
    return;
  }
  const cfg = await getConfig(ctx.env);
  const result = await redeemOrder(ctx.env.DB, ctx.from.id, code);
  const user = await getUser(ctx.env.DB, ctx.from.id);
  if (result === 'ok') {
    await ctx.reply(`✅ 兑换成功！\n当前${cfg.brand.pointsName}：<b>${fmt(user?.points ?? 0)}</b>`);
  } else if (result === 'used') {
    await ctx.reply('该兑换码已被使用，请勿重复兑换。');
  } else {
    await ctx.reply('兑换码不存在或已失效。');
  }
}