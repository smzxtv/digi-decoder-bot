import type { Ctx } from '../ctx';
import { getConfig } from '../config';
import { getUser, getUserRank, registerInvite } from '../db';
import { esc } from '../utils/text';
import { b64Encode, b64Decode, jsonBeautify, dnsQuery, pingHost, queryIp } from '../utils/network';
import { btn } from '../telegram';
import { mainKeyboard, mainMenuText } from './menu';
import { showTools } from './tools';
import { doCheckin, checkinHome } from './checkin';
import { cmdMe, cmdTop, cmdInvite, cmdRedeem } from './points';
import { cmdAI } from './aiChat';
import { tutorialsHome } from './tutorials';
import { cmdLucky } from './lucky';
import { clearPending } from './tools';

export type CommandHandler = (ctx: Ctx) => Promise<void>;

// ---------------- 基础 ----------------

/** /start 注册 + 主菜单 */
export const cmdStart: CommandHandler = async (ctx) => {
  if (!ctx.from) return;
  const cfg = await getConfig(ctx.env);
  const payload = ctx.arg.trim();

  let joinNote = '';
  if (payload.startsWith('ref_')) {
    const inviterId = Number(payload.slice(4));
    if (Number.isInteger(inviterId) && inviterId > 0 && inviterId !== ctx.from.id) {
      const r = await registerInvite(
        ctx.env.DB,
        inviterId,
        ctx.from.id,
        cfg.invite.invitedReward,
        cfg.invite.inviterReward
      );
      if (r === 'ok') {
        joinNote = `🎉 你通过邀请链接加入，获得 <b>+${cfg.invite.invitedReward}</b> ${cfg.brand.pointsName}！\n\n`;
      }
    }
  }

  const [user, rank] = await Promise.all([
    getUser(ctx.env.DB, ctx.from.id),
    getUserRank(ctx.env.DB, ctx.from.id),
  ]);
  await ctx.reply(joinNote + mainMenuText(user, cfg, rank), {
    inlineKeyboard: mainKeyboard(ctx.isAdmin, !!user),
  });
};

/** /help 帮助 */
export const cmdHelp: CommandHandler = async (ctx) => {
  const text = [
    `🤖 <b>数码解码工具站</b>`,
    ``,
    `📝 <b>签到</b>`,
    `<code>/checkin</code> 今日签到　<code>/checkin</code> 菜单含本月记录`,
    `<code>/top</code> 签到排行`,
    ``,
    `🧰 <b>工具箱</b>`,
    `<code>/tools</code> 工具箱面板`,
    `<code>/b64</code> Base64　<code>/url</code> URL编解码　<code>/json</code> JSON整理`,
    `<code>/dns</code> DNS查询　<code>/ping</code> 延迟检测　<code>/ip</code> IP查询`,
    ``,
    `📚 <b>学习 & AI</b>`,
    `<code>/tutorials</code> 教程中心`,
    `<code>/ai 问题</code> AI 智能问答`,
    ``,
    `🎁 <b>福利</b>`,
    `<code>/invite</code> 邀请奖励　<code>/lucky</code> 幸运粉丝`,
    `<code>/me</code> 我的解码点　<code>/redeem</code> 兑换码`,
  ].join('\n');
  await ctx.reply(text, { inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]] });
};

/** /cancel 清除待处理工具状态 */
export const cmdCancel: CommandHandler = async (ctx) => {
  if (ctx.from) await clearPending(ctx.env, ctx.from.id);
  await ctx.reply('已取消当前操作。', { inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]] });
};

// ---------------- 工具箱直接命令 ----------------

export const cmdB64: CommandHandler = async (ctx) => {
  const raw = ctx.arg.trim();
  if (!raw) return showTools(ctx);
  const m = raw.match(/^(enc(ode)?|dec(ode)?)\s+([\s\S]+)$/i);
  const mode = m ? (/^de/i.test(m[1]) ? 'decode' : 'encode') : 'encode';
  const data = m ? m[4] : raw;
  try {
    const out = mode === 'encode' ? b64Encode(data) : b64Decode(data);
    await ctx.reply(`<b>${mode === 'encode' ? '编码' : '解码'}结果：</b>\n<code>${esc(out.slice(0, 3800))}</code>`);
  } catch (e) {
    await ctx.reply(`⚠️ ${e instanceof Error ? e.message : '处理失败'}`);
  }
};

export const cmdUrl: CommandHandler = async (ctx) => {
  const raw = ctx.arg.trim();
  if (!raw) return showTools(ctx);
  const m = raw.match(/^(enc(ode)?|dec(ode)?)\s+([\s\S]+)$/i);
  const mode = m ? (/^de/i.test(m[1]) ? 'decode' : 'encode') : 'encode';
  const data = m ? m[4] : raw;
  const out = mode === 'encode' ? encodeURIComponent(data) : (() => { try { return decodeURIComponent(data); } catch { throw new Error('URL 解码失败：内容不是合法的百分号编码'); } })();
  try {
    await ctx.reply(`<b>${mode === 'encode' ? '编码' : '解码'}结果：</b>\n<code>${esc(out.slice(0, 3800))}</code>`);
  } catch (e) {
    await ctx.reply(`⚠️ ${e instanceof Error ? e.message : '处理失败'}`);
  }
};

export const cmdJson: CommandHandler = async (ctx) => {
  const raw = ctx.arg.trim();
  if (!raw) return showTools(ctx);
  try {
    const out = jsonBeautify(raw);
    await ctx.reply(`🧾 格式化结果：\n<code>${esc(out.slice(0, 3800))}</code>`);
  } catch {
    await ctx.reply(`⚠️ 无法解析 JSON，请检查格式是否正确。`);
  }
};

export const cmdDns: CommandHandler = async (ctx) => {
  const parts = ctx.arg.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    await ctx.reply('用法：/dns <域名> [记录类型(A/AAAA/MX/TXT)]');
    return;
  }
  const [domain, type = 'A'] = parts;
  try {
    const answers = await dnsQuery(domain, type.toUpperCase());
    const lines = answers.map((a) => `　● <code>${esc(a.data)}</code> <code>${a.type}</code> TTL ${a.TTL}`);
    await ctx.reply([`🌐 DNS 查询：<b>${esc(domain)}</b> <code>${type.toUpperCase()}</code>`, ...lines].join('\n'));
  } catch (e) {
    await ctx.reply(`⚠️ ${e instanceof Error ? e.message : '查询失败'}`);
  }
};

export const cmdPing: CommandHandler = async (ctx) => {
  const host = ctx.arg.trim();
  if (!host) {
    await ctx.reply('用法：/ping <域名或IP>', { inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]] });
    return;
  }
  try {
    const r = await pingHost(host);
    await ctx.reply(
      [
        `📡 Ping 检测：<b>${esc(r.host)}</b>`,
        `　HTTP 状态：${r.httpStatus !== null ? `<code>${r.httpStatus}</code>` : '❌ 不可达'}`,
        `　延迟：<b>${r.latencyMs}ms</b>`,
      ].join('\n')
    );
  } catch (e) {
    await ctx.reply(`⚠️ ${e instanceof Error ? e.message : '检测失败'}`);
  }
};

export const cmdIp: CommandHandler = async (ctx) => {
  try {
    const info = await queryIp();
    await ctx.reply(
      [
        `🌍 <b>IP 查询结果</b>`,
        `　IP 地址：<code>${esc(info.ip)}</code>`,
        `　国家/地区：${info.loc ?? '未知'}`,
        `　数据中心：${info.colo ?? '-'}`,
        `　ASN：${info.asn ?? '-'}`,
      ].join('\n'),
      { inlineKeyboard: [[btn('🔄 刷新', 'tl:ip')]] }
    );
  } catch {
    await ctx.reply('⚠️ IP 查询失败，请稍后再试。');
  }
};

// ---------------- 教程 / 幸运粉丝 ----------------

export const cmdTutorials: CommandHandler = async (ctx) => {
  await tutorialsHome(ctx);
};

// ---------------- 命令表 ----------------

export const COMMANDS: Record<string, CommandHandler> = {
  start: cmdStart,
  me: cmdMe,
  help: cmdHelp,
  checkin: doCheckin,
  top: cmdTop,
  invite: cmdInvite,
  redeem: cmdRedeem,
  tools: showTools,
  b64: cmdB64,
  url: cmdUrl,
  json: cmdJson,
  dns: cmdDns,
  ping: cmdPing,
  ip: cmdIp,
  ai: cmdAI,
  tutorial: cmdTutorials,
  tutorials: cmdTutorials,
  lucky: cmdLucky,
  cancel: cmdCancel,
  // 管理员命令在 adminCommands.ts 中合并
};

// checkinHome 在签到面板按钮中通过 ck:show 触发
void checkinHome;
