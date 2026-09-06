import type { Ctx } from '../ctx';
import { getConfig, type BotConfig } from '../config';
import { getUser, getUserRank } from '../db';
import { doCheckin, checkinHome, checkinMonth } from './checkin';
import { cmdTop, cmdInvite, cmdMe } from './points';
import { handleToolsCallback, showTools } from './tools';
import { tutorialsHome } from './tutorials';
import { aiHelp } from './aiChat';
import { luckyHome, luckyAdmin, luckyCount, luckyList, luckyDraw, luckyRedraw, luckyWinners, luckyShip, luckyHistory } from './lucky';
import { cmdHelp } from './commands';
import { adminPanel, cmdStats, cmdReload } from './admin';
import { mainKeyboard, mainMenuText } from './menu';

/** 行内按钮回调总入口 */
export async function handleCallback(ctx: Ctx): Promise<void> {
  const data = ctx.query?.data ?? '';
  if (!data) return;

  const head = data.split(':')[0];
  switch (head) {
    case 'menu':
      if (data === 'menu:main') await renderMainMenu(ctx);
      break;
    case 'ck':
      if (data === 'ck:do') await doCheckin(ctx);
      else if (data === 'ck:show') await checkinHome(ctx);
      else if (data === 'ck:month') await checkinMonth(ctx);
      break;
    case 'pt':
      if (data === 'pt:me') await cmdMe(ctx);
      else if (data === 'pt:top') await cmdTop(ctx);
      break;
    case 'in':
      if (data === 'in:me') await cmdInvite(ctx);
      break;
    case 'hp':
      if (data === 'hp:show') await cmdHelp(ctx);
      break;
    case 'lk': {
      const op = data.split(':')[1];
      if (op === 'show' || op === undefined) {
        await luckyHome(ctx);
        break;
      }
      // 管理操作需管理员权限
      if (!ctx.isOwner && !ctx.isAdmin) {
        await ctx.answer('❌ 无管理员权限', true);
        break;
      }
      if (op === 'admin') await luckyAdmin(ctx);
      else if (op === 'count') await luckyCount(ctx);
      else if (op === 'list') await luckyList(ctx);
      else if (op === 'draw') await luckyDraw(ctx);
      else if (op === 'redraw') await luckyRedraw(ctx);
      else if (op === 'winners') await luckyWinners(ctx);
      else if (op === 'ship') await luckyShip(ctx);
      else if (op === 'history') await luckyHistory(ctx);
      break;
    }
    case 'tl':
      await handleToolsCallback(ctx, data);
      break;
    case 'tu':
      if (data === 'tu:show') await tutorialsHome(ctx);
      break;
    case 'ai':
      if (data === 'ai:show') await aiHelp(ctx);
      break;
    case 'ad': {
      if (!ctx.isOwner && !ctx.isAdmin) {
        await ctx.answer('❌ 无管理员权限', true);
        return;
      }
      const op = data.split(':')[1];
      if (op === 'panel') await adminPanel(ctx);
      else if (op === 'stats') await cmdStats(ctx);
      else if (op === 'reload') await cmdReload(ctx);
      break;
    }
    default:
      await ctx.answer('⚠️ 未知操作', true);
  }
}

/** 重新渲染主菜单 */
export async function renderMainMenu(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  const user = ctx.from ? await getUser(ctx.env.DB, ctx.from.id) : null;
  const rank = ctx.from ? await getUserRank(ctx.env.DB, ctx.from.id) : 0;
  await ctx.reply(mainMenuText(user, cfg, rank), { inlineKeyboard: mainKeyboard(ctx.isAdmin, !!user) });
}

/** 供其它模块复用（home 卡片渲染） */
export async function renderMainMenuTo(ctx: Ctx, cfg: BotConfig): Promise<void> {
  const user = ctx.from ? await getUser(ctx.env.DB, ctx.from.id) : null;
  const rank = ctx.from ? await getUserRank(ctx.env.DB, ctx.from.id) : 0;
  await ctx.reply(mainMenuText(user, cfg, rank), { inlineKeyboard: mainKeyboard(ctx.isAdmin, !!user) });
}
