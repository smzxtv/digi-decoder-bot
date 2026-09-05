import type { Ctx } from '../ctx';
import { COMMANDS, type CommandHandler } from './commands';
import {
  adminPanel,
  cmdStats,
  cmdBan,
  cmdUnban,
  cmdGive,
  cmdGenCode,
  cmdCfg,
  cmdSetJson,
  cmdReload,
  cmdLog,
  cmdBroadcast,
  cmdNotify,
  cmdAddAd,
  cmdDelAd,
  cmdAdList,
  cmdAdBlock,
} from './admin';

/** 包一层权限校验 */
function requireAdmin(h: CommandHandler): CommandHandler {
  return async (ctx: Ctx) => {
    if (!ctx.isOwner && !ctx.isAdmin) {
      await ctx.reply('❌ 无管理员权限');
      return;
    }
    await h(ctx);
  };
}

export const ADMIN_COMMANDS: Record<string, CommandHandler> = {
  admin: requireAdmin(adminPanel),
  stats: requireAdmin(cmdStats),
  ban: requireAdmin(cmdBan),
  unban: requireAdmin(cmdUnban),
  give: requireAdmin(cmdGive),
  gencode: requireAdmin(cmdGenCode),
  cfg: requireAdmin(cmdCfg),
  setjson: requireAdmin(cmdSetJson),
  reload: requireAdmin(cmdReload),
  log: requireAdmin(cmdLog),
  broadcast: requireAdmin(cmdBroadcast),
  notify: requireAdmin(cmdNotify),
  addad: requireAdmin(cmdAddAd),
  delad: requireAdmin(cmdDelAd),
  adlist: requireAdmin(cmdAdList),
  adblock: requireAdmin(cmdAdBlock),
};

/** 全量命令表 */
export const ALL_COMMANDS: Record<string, CommandHandler> = {
  ...COMMANDS,
  ...ADMIN_COMMANDS,
};