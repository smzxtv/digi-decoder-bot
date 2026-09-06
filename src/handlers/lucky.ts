import type { Ctx } from '../ctx';
import { getConfig, setConfigOverlay } from '../config';
import {
  getActiveCampaign,
  createCampaign,
  getEligibleUsers,
  campaignWinners,
  pastCampaigns,
  drawCampaign,
  finalizeCampaign,
  redrawLast,
  markShipped,
  monthCheckinCount,
} from '../db';
import { localDate } from '../db';
import { tzOffsetHours } from '../env';
import { btn } from '../telegram';
import { esc, fmt } from '../utils/text';
import type { TgInlineKeyboardButton } from '../telegram-types';

// ============ 用户面板 ============

/** 幸运粉丝面板（所有用户可见） */
export async function luckyHome(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  if (!cfg.lucky.enabled) {
    await ctx.reply('🎁 幸运粉丝活动暂未开放，敬请期待。', {
      inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]],
    });
    return;
  }
  const tz = tzOffsetHours(ctx.env);
  const month = localDate(new Date(), tz).slice(0, 7);
  const camp = await getActiveCampaign(ctx.env.DB);
  const drawnCamp = camp ? null : (await pastCampaigns(ctx.env.DB, 1))[0] ?? null;

  const lines: string[] = [`🎁 <b>幸运粉丝</b>`, ``];

  if (camp) {
    const myCount = ctx.from ? await monthCheckinCount(ctx.env.DB, ctx.from.id, month) : 0;
    const qualified = myCount >= camp.min_checkins;
    lines.push(
      `🎫 活动名称：<b>${esc(camp.title)}</b>`,
      `🏆 本月奖品：<b>${esc(camp.prize)} × ${camp.winners_count}</b>`,
      `📌 参与门槛：当月签到满 <b>${camp.min_checkins}</b> 天`,
      ``,
      `📊 你的本月签到：<b>${fmt(myCount)}</b> 天`,
      qualified ? '✅ 已获得抽奖资格！' : `📌 再签到 ${camp.min_checkins - myCount} 天即可获得资格`
    );
  } else if (drawnCamp && drawnCamp.status === 'drawn') {
    lines.push('本次活动已开奖，中奖名单如下：');
  } else {
    lines.push('📭 暂无进行中的活动，敬请期待。');
  }

  const showCamp = camp ?? (drawnCamp?.status === 'drawn' ? drawnCamp : null);
  if (showCamp) {
    const winners = await campaignWinners(ctx.env.DB, showCamp.id);
    if (winners.length > 0) {
      lines.push('', '🎉 中奖名单：');
      for (const w of winners) {
        const name = w.first_name || (w.username ? '@' + w.username : String(w.user_id));
        lines.push(`　🎊 ${esc(name)}${w.shipped ? '（已发货 📦）' : ''}`);
      }
    } else if (!camp) {
      lines.push('暂无中奖记录。');
    }
  }

  const kb: TgInlineKeyboardButton[][] = [[btn('✍️ 去签到', 'ck:do'), btn('🔥 签到排行', 'pt:top')]];
  if (ctx.isOwner || ctx.isAdmin) kb.push([btn('🛠 活动管理', 'lk:admin')]);
  kb.push([btn('⬅ 返回主菜单', 'menu:main')]);
  await ctx.reply(lines.join('\n'), { inlineKeyboard: kb });
}

// ============ 管理面板 ============

/** 管理面板（lk:admin） */
export async function luckyAdmin(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  const tz = tzOffsetHours(ctx.env);
  const month = localDate(new Date(), tz).slice(0, 7);
  const camp = await getActiveCampaign(ctx.env.DB);

  const lines: string[] = [`🎁 <b>幸运粉丝管理</b>`, ``];
  if (camp) {
    const eligible = await getEligibleUsers(ctx.env.DB, camp, month);
    lines.push(
      `🎫 当前活动：<b>${esc(camp.title)}</b>`,
      `🏆 奖品：<b>${esc(camp.prize)} × ${camp.winners_count}</b>`,
      `📌 门槛：当月签到满 ${camp.min_checkins} 天`,
      `👥 参与人数：<b>${eligible.length}</b>`,
      `📢 公告群：${cfg.lucky.announceChatId ? `<code>${esc(cfg.lucky.announceChatId)}</code>（已绑定）` : '未绑定（在粉丝群发 /lucky announce）'}`,
      ``,
      `🎲 就绪后点击下方「开奖」`
    );
  } else {
    lines.push(
      '📭 当前没有进行中的活动。',
      '',
      '➕ 发送 /lucky create 创建新活动：',
      '<code>/lucky create 奖品|名额|门槛|活动名称</code>',
      '例：<code>/lucky create 充电器|2|5|12月幸运粉丝</code>'
    );
  }

  const kb: TgInlineKeyboardButton[][] = [];
  if (camp) {
    kb.push([btn('👥 参与人数', 'lk:count'), btn('📋 资格名单', 'lk:list')]);
    kb.push([btn('🎲 开奖', 'lk:draw'), btn('🔄 补抽', 'lk:redraw')]);
    kb.push([btn('🏆 中奖名单', 'lk:winners'), btn('📦 发货管理', 'lk:ship')]);
  }
  kb.push([btn('📜 历史活动', 'lk:history')]);
  kb.push([btn('⬅ 返回主菜单', 'menu:main')]);

  await ctx.reply(lines.join('\n'), { inlineKeyboard: kb });
}

function replyNoCamp(ctx: Ctx): Promise<void> {
  return ctx.reply('📭 暂无进行中的活动。\n➕ 创建：<code>/lucky create 奖品|名额|门槛|活动名称</code>', {
    inlineKeyboard: [[btn('⬅ 管理', 'lk:admin')]],
  });
}

// ============ 管理操作 ============

/** 参与人数 */
export async function luckyCount(ctx: Ctx): Promise<void> {
  const camp = await getActiveCampaign(ctx.env.DB);
  if (!camp) return replyNoCamp(ctx);
  const tz = tzOffsetHours(ctx.env);
  const month = localDate(new Date(), tz).slice(0, 7);
  const eligible = await getEligibleUsers(ctx.env.DB, camp, month);
  await ctx.reply(
    `👥 <b>参与人数</b>\n\n🎫 ${esc(camp.title)}\n符合资格用户：<b>${eligible.length}</b> 人\n（当月签到满 ${camp.min_checkins} 天）`,
    { inlineKeyboard: [[btn('📋 查看名单', 'lk:list'), btn('⬅ 管理', 'lk:admin')]] }
  );
}

/** 资格名单 */
export async function luckyList(ctx: Ctx): Promise<void> {
  const camp = await getActiveCampaign(ctx.env.DB);
  if (!camp) return replyNoCamp(ctx);
  const tz = tzOffsetHours(ctx.env);
  const month = localDate(new Date(), tz).slice(0, 7);
  const eligible = await getEligibleUsers(ctx.env.DB, camp, month);
  if (eligible.length === 0) {
    await ctx.reply('📋 暂无符合资格的用户。', { inlineKeyboard: [[btn('⬅ 管理', 'lk:admin')]] });
    return;
  }
  const rows = eligible.slice(0, 40).map(
    (u, i) => `${i + 1}. ${esc(u.first_name || String(u.id))}${u.username ? ' (@' + esc(u.username) + ')' : ''} — ${u.days} 天`
  );
  await ctx.reply(
    [`📋 <b>资格名单</b>（${eligible.length} 人，最多显示 40）`, '', ...rows].join('\n'),
    { inlineKeyboard: [[btn('🎲 去开奖', 'lk:draw'), btn('⬅ 管理', 'lk:admin')]] }
  );
}

/** 开奖 */
export async function luckyDraw(ctx: Ctx): Promise<void> {
  const camp = await getActiveCampaign(ctx.env.DB);
  if (!camp) return replyNoCamp(ctx);
  const cfg = await getConfig(ctx.env);
  const tz = tzOffsetHours(ctx.env);
  const month = localDate(new Date(), tz).slice(0, 7);
  const existing = await campaignWinners(ctx.env.DB, camp.id);
  const remain = camp.winners_count - existing.length;
  if (remain <= 0) {
    await ctx.reply('⚠️ 中奖名额已满。如需更换中奖者请使用「补抽」。', {
      inlineKeyboard: [[btn('🏆 查看中奖名单', 'lk:winners'), btn('🔄 补抽', 'lk:redraw')]],
    });
    return;
  }
  const drawn = await drawCampaign(ctx.env.DB, camp, month, remain);
  if (drawn.length === 0) {
    await ctx.reply('⚠️ 暂无符合资格的用户，无法开奖。', { inlineKeyboard: [[btn('⬅ 管理', 'lk:admin')]] });
    return;
  }
  await finalizeCampaign(ctx.env.DB, camp, month);
  const names = drawn
    .map((u) => `🎊 ${esc(u.first_name || String(u.id))}${u.username ? ' (@' + esc(u.username) + ')' : ''}`)
    .join('\n');
  const announce =
    `🎉 <b>幸运粉丝开奖啦！</b>\n\n` +
    `🎫 活动：${esc(camp.title)}\n` +
    `🏆 奖品：${esc(camp.prize)} × ${camp.winners_count}\n\n` +
    `恭喜以下幸运粉丝：\n${names}\n\n` +
    `📝 每日签到 /checkin，下个月也许就是你！`;
  await ctx.reply(
    `🎉 <b>开奖完成！</b>\n\n${names}\n\n📦 请用 /lucky ship 用户ID 快递单号 登记发货`,
    { inlineKeyboard: [[btn('🏆 中奖名单', 'lk:winners'), btn('📦 发货管理', 'lk:ship')]] }
  );
  // 自动推送到粉丝群
  if (cfg.lucky.announceChatId) {
    try {
      await ctx.bot.sendMessage(cfg.lucky.announceChatId, announce, { parse_mode: 'HTML' });
      await ctx.reply(`📢 开奖公告已推送到群 <code>${esc(cfg.lucky.announceChatId)}</code>`);
    } catch (e) {
      await ctx.reply(`⚠️ 公告推送失败：${e instanceof Error ? esc(e.message) : '未知错误'}\n请检查机器人是否已加入该群。`);
    }
  }
}

/** 绑定公告推送群（管理员在目标群里发送 /lucky announce） */
export async function luckyAnnounce(ctx: Ctx): Promise<void> {
  if (!ctx.chat || !ctx.isGroup) {
    await ctx.reply('⚠️ 请在要接收公告的粉丝群里发送此命令：/lucky announce');
    return;
  }
  const cfg = await getConfig(ctx.env);
  const newCfg = { lucky: { ...cfg.lucky, announceChatId: String(ctx.chat.id) } };
  await setConfigOverlay(ctx.env, newCfg);
  await ctx.reply(`✅ 已绑定本群为开奖公告群（<code>${ctx.chat.id}</code>）。\n之后每次开奖都会自动推送结果到这里。`);
}

/** 补抽（更换最后一名中奖者） */
export async function luckyRedraw(ctx: Ctx): Promise<void> {
  const camp = await getActiveCampaign(ctx.env.DB);
  if (!camp) return replyNoCamp(ctx);
  const tz = tzOffsetHours(ctx.env);
  const month = localDate(new Date(), tz).slice(0, 7);
  const r = await redrawLast(ctx.env.DB, camp, month);
  if (r.added.length === 0) {
    await ctx.reply('⚠️ 补抽失败：没有其他符合资格的用户。', { inlineKeyboard: [[btn('⬅ 管理', 'lk:admin')]] });
    return;
  }
  const u = r.added[0];
  await ctx.reply(
    `🔄 <b>补抽完成</b>\n\n已移除原中奖者 ${r.removed} 名，补抽结果：\n🎊 ${esc(u.first_name || String(u.id))}${u.username ? ' (@' + esc(u.username) + ')' : ''}`,
    { inlineKeyboard: [[btn('🏆 中奖名单', 'lk:winners'), btn('⬅ 管理', 'lk:admin')]] }
  );
}

/** 中奖名单 */
export async function luckyWinners(ctx: Ctx): Promise<void> {
  const camp = await getActiveCampaign(ctx.env.DB);
  if (!camp) return replyNoCamp(ctx);
  const winners = await campaignWinners(ctx.env.DB, camp.id);
  if (winners.length === 0) {
    await ctx.reply('🏆 尚未开奖或暂无中奖者。', {
      inlineKeyboard: [[btn('🎲 去开奖', 'lk:draw'), btn('⬅ 管理', 'lk:admin')]],
    });
    return;
  }
  const rows = winners.map((w, i) => {
    const name = w.first_name || (w.username ? '@' + w.username : String(w.user_id));
    return `${i + 1}. ${esc(name)}（ID: <code>${w.user_id}</code>）${w.shipped ? `📦 已发货 ${esc(w.ship_note)}` : '⏳ 待发货'}`;
  });
  await ctx.reply([`🏆 <b>中奖名单</b> — ${esc(camp.title)}`, '', ...rows].join('\n'), {
    inlineKeyboard: [[btn('📦 发货管理', 'lk:ship'), btn('⬅ 管理', 'lk:admin')]],
  });
}

/** 发货管理 */
export async function luckyShip(ctx: Ctx): Promise<void> {
  const camp = await getActiveCampaign(ctx.env.DB);
  const target = camp ?? (await pastCampaigns(ctx.env.DB, 1))[0];
  if (!target) return replyNoCamp(ctx);
  const winners = await campaignWinners(ctx.env.DB, target.id);
  if (winners.length === 0) {
    await ctx.reply('📦 暂无中奖者需要发货。', { inlineKeyboard: [[btn('⬅ 管理', 'lk:admin')]] });
    return;
  }
  const rows = winners.map((w) => {
    const name = w.first_name || (w.username ? '@' + w.username : String(w.user_id));
    return `${w.shipped ? '✅' : '⏳'} ${esc(name)}（ID: <code>${w.user_id}</code>）${w.shipped ? '\n　　🚚 ' + esc(w.ship_note) : ''}`;
  });
  await ctx.reply(
    [`📦 <b>发货管理</b> — ${esc(target.title)}`, '', ...rows, '', '登记发货：', '<code>/lucky ship 用户ID 快递单号/备注</code>'].join('\n'),
    { inlineKeyboard: [[btn('⬅ 管理', 'lk:admin')]] }
  );
}

/** 历史活动 */
export async function luckyHistory(ctx: Ctx): Promise<void> {
  const list = await pastCampaigns(ctx.env.DB, 10);
  if (list.length === 0) {
    await ctx.reply('📜 暂无历史活动。', { inlineKeyboard: [[btn('⬅ 管理', 'lk:admin')]] });
    return;
  }
  const rows: string[] = [];
  for (const c of list) {
    const winners = await campaignWinners(ctx.env.DB, c.id);
    const winnerNames =
      winners.map((w) => w.first_name || (w.username ? '@' + w.username : String(w.user_id))).join('、') || '无';
    rows.push(
      `🎫 <b>${esc(c.title)}</b>（${c.draw_month ?? '未记录'}）`,
      `　🏆 ${esc(c.prize)} × ${c.winners_count}　状态：${c.status === 'drawn' ? '已开奖' : '已关闭'}`,
      `　🎊 中奖：${esc(winnerNames)}`,
      ''
    );
  }
  await ctx.reply([`📜 <b>历史活动</b>`, '', ...rows].join('\n'), {
    inlineKeyboard: [[btn('⬅ 管理', 'lk:admin')]],
  });
}

/** 创建活动 */
export async function luckyCreate(ctx: Ctx, arg: string): Promise<void> {
  const parts = arg.split('|').map((s) => s.trim());
  const prize = parts[0];
  const winnersCount = Number(parts[1]);
  const minCheckins = Number(parts[2]);
  const title = parts[3] || '幸运粉丝抽奖';
  if (
    !prize ||
    !Number.isInteger(winnersCount) ||
    winnersCount <= 0 ||
    !Number.isInteger(minCheckins) ||
    minCheckins <= 0
  ) {
    await ctx.reply(
      '用法：<code>/lucky create 奖品|名额|门槛|活动名称</code>\n例：<code>/lucky create 充电器|2|5|12月幸运粉丝</code>'
    );
    return;
  }
  const camp = await createCampaign(ctx.env.DB, {
    title,
    prize,
    winnersCount,
    minCheckins,
    createdBy: ctx.from!.id,
  });
  await ctx.reply(
    `✅ <b>活动已创建</b>\n\n🎫 ${esc(camp.title)}\n🏆 奖品：${esc(camp.prize)} × ${camp.winners_count}\n📌 门槛：当月签到满 ${camp.min_checkins} 天\n\n开奖方式：面板点击「开奖」或 /lucky draw`,
    { inlineKeyboard: [[btn('🛠 打开管理面板', 'lk:admin')]] }
  );
}

/** 登记发货 */
export async function luckyShipMark(ctx: Ctx, arg: string): Promise<void> {
  const parts = arg.trim().split(/\s+/);
  const userId = Number(parts[0]);
  const note = parts.slice(1).join(' ') || '已发货';
  if (!Number.isInteger(userId) || userId <= 0) {
    await ctx.reply('用法：<code>/lucky ship 用户ID 快递单号/备注</code>');
    return;
  }
  const camp = await getActiveCampaign(ctx.env.DB);
  const target = camp ?? (await pastCampaigns(ctx.env.DB, 1))[0];
  if (!target) return replyNoCamp(ctx);
  const ok = await markShipped(ctx.env.DB, target.id, userId, note);
  await ctx.reply(
    ok ? `✅ 已标记用户 <b>${userId}</b> 为已发货。\n🚚 ${esc(note)}` : '⚠️ 未找到该用户的中奖记录。'
  );
}

// ============ /lucky 总入口 ============

export async function cmdLucky(ctx: Ctx): Promise<void> {
  const arg = ctx.arg.trim();
  if (ctx.isOwner || ctx.isAdmin) {
    if (arg.startsWith('create')) return luckyCreate(ctx, arg.slice(6).trim());
    if (arg.startsWith('ship')) return luckyShipMark(ctx, arg.slice(4).trim());
    if (arg === 'announce') return luckyAnnounce(ctx);
    if (arg === 'draw') return luckyDraw(ctx);
    if (arg === 'redraw') return luckyRedraw(ctx);
    if (arg === 'list') return luckyList(ctx);
    if (arg === 'winners') return luckyWinners(ctx);
    if (arg === 'history') return luckyHistory(ctx);
    return luckyAdmin(ctx);
  }
  return luckyHome(ctx);
}