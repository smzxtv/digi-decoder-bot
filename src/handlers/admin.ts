import type { Ctx } from '../ctx';
import { getConfig, resetConfig, setConfigOverlay } from '../config';
import { addPoints, ban, createOrder, getStats, unban } from '../db';
import { btn } from '../telegram';
import { esc, fmt } from '../utils/text';
import { genOrderCodes } from '../utils/tokens';
import type { Env } from '../env';

/** 管理面板 */
export async function adminPanel(ctx: Ctx): Promise<void> {
  await ctx.reply(
    `⚙️ <b>管理面板</b>\n\n` +
      `常用管理命令：\n` +
      `<code>/stats</code>　统计概览\n` +
      `<code>/ban id [原因]</code>　拉黑用户\n` +
      `<code>/unban id</code>　解除黑名单\n` +
      `<code>/give id 解码点</code>　调整解码点\n` +
      `<code>/gencode 解码点 数量</code>　生成兑换码\n` +
      `<code>/broadcast 文案</code>　群发广播\n` +
      `<code>/notify id 文案</code>　私聊推送\n` +
      `<code>/cfg</code>　　查看配置\n` +
      `<code>/setjson {...}</code>　更新配置\n` +
      `<code>/reload</code>　重载配置\n` +
      `<code>/log</code>　操作日志`,
    {
      inlineKeyboard: [
        [btn('📊 统计', 'ad:stats'), btn('🔧 重载配置', 'ad:reload')],
        [btn('⬅ 返回主菜单', 'menu:main')],
      ],
    }
  );
}

/** /stats */
export async function cmdStats(ctx: Ctx): Promise<void> {
  const s = await getStats(ctx.env.DB);
  await ctx.reply(
    [
      `📊 <b>运行统计</b>`,
      ``,
      `👥 注册用户：<b>${fmt(s.users)}</b>`,
      `💎 发行解码点：<b>${fmt(s.points)}</b>`,
      `✅ 今日签到：<b>${fmt(s.todayCheckins)}</b>`,
      `🎟️ 未用兑换码：<b>${fmt(s.unusedOrders)}</b>（${fmt(s.unusedPoints)} 解码点）`,
    ].join('\n')
  );
}

/** /ban <id> [原因] */
export async function cmdBan(ctx: Ctx): Promise<void> {
  const arg = ctx.arg;
  const parts = arg.trim().split(/\s+/);
  const id = Number(parts[0]);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.reply('用法：/ban <用户ID> [原因]');
    return;
  }
  const reason = parts.slice(1).join(' ') || '无';
  await ban(ctx.env.DB, 'user', id, reason, ctx.from!.id);
  await ctx.reply(`🚫 已将用户 <b>${id}</b> 加入黑名单。原因：${esc(reason)}`);
  await appendLog(ctx.env, `🚫 拉黑 ${id}（${reason}）by ${ctx.from!.id}`);
}

/** /unban <id> */
export async function cmdUnban(ctx: Ctx): Promise<void> {
  const arg = ctx.arg;
  const id = Number(arg.trim());
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.reply('用法：/unban <用户ID>');
    return;
  }
  await unban(ctx.env.DB, 'user', id);
  await ctx.reply(`✅ 已解除用户 <b>${id}</b> 的黑名单。`);
  await appendLog(ctx.env, `✅ 解封 ${id} by ${ctx.from!.id}`);
}

/** /give <id> <积分> */
export async function cmdGive(ctx: Ctx): Promise<void> {
  const arg = ctx.arg;
  const parts = arg.trim().split(/\s+/);
  const id = Number(parts[0]);
  const points = Number(parts[1]);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(points)) {
    await ctx.reply('用法：/give <用户ID> <解码点>（可为负数）');
    return;
  }
  const user = await addPoints(ctx.env.DB, id, points);
  await ctx.reply(
    `✅ 已调整用户 <b>${id}</b> 解码点：<code>${points > 0 ? '+' : ''}${points}</code>，当前 <b>${fmt(user.points)}</b>`
  );
  await appendLog(ctx.env, `💰 调整积分 ${id} ${points} by ${ctx.from!.id}`);
}

/** /gencode <积分> <数量> */
export async function cmdGenCode(ctx: Ctx): Promise<void> {
  const arg = ctx.arg;
  const parts = arg.trim().split(/\s+/);
  const amount = Number(parts[0]);
  const count = Math.min(Math.max(Number(parts[1] ?? '1'), 1), 50);
  if (!Number.isInteger(amount) || amount <= 0) {
    await ctx.reply('用法：/gencode <解码点数量> <生成个数>');
    return;
  }
  const codes = genOrderCodes(count);
  for (const c of codes) await createOrder(ctx.env.DB, c, amount, ctx.from!.id);
  if (ctx.from) await appendLog(ctx.env, `🎟️ 生成 ${count} 个兑换码，每个 ${amount} by ${ctx.from.id}`);
  await ctx.reply(`✅ 已生成 <b>${count}</b> 个兑换码，每个 ${amount} 解码点：\n<code>${codes.join('</code>\n<code>')}</code>`);
}

/** /cfg 查看生效配置 */
export async function cmdCfg(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  const json = JSON.stringify(cfg, null, 2).slice(0, 3800);
  await ctx.reply(`📜 当前配置（JSON）：\n<code>${esc(json)}</code>`);
}

/** /setjson {...} 更新配置覆盖层 */
export async function cmdSetJson(ctx: Ctx): Promise<void> {
  try {
    const obj = JSON.parse(ctx.arg);
    if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) throw new Error('必须是 JSON 对象');
    await setConfigOverlay(ctx.env, obj);
    await ctx.reply('✅ 配置已更新（覆盖层与默认配置合并）。可用 /cfg 查看。');
    if (ctx.from) await appendLog(ctx.env, `⚙️ 更新配置 by ${ctx.from.id}`);
  } catch (e) {
    await ctx.reply(`❌ 配置 JSON 解析失败：${e instanceof Error ? e.message : '未知错误'}`);
  }
}

/** /reload 重置为默认配置 */
export async function cmdReload(ctx: Ctx): Promise<void> {
  await resetConfig(ctx.env);
  await getConfig(ctx.env); // 重新填充 KV 缓存
  await ctx.reply('✅ 配置已重置为默认值。');
  if (ctx.from) await appendLog(ctx.env, `🔧 重置配置 by ${ctx.from.id}`);
}

/** /log 查看最近操作日志 */
export async function cmdLog(ctx: Ctx): Promise<void> {
  const lines = (await readLogs(ctx.env)).slice(-30);
  if (lines.length === 0) {
    await ctx.reply('暂无日志。');
    return;
  }
  await ctx.reply(`📜 <b>最近操作</b>\n<code>${esc(lines.join('\n'))}</code>`);
}

/** /broadcast <文案> —— 入队异步群发 */
export async function cmdBroadcast(ctx: Ctx): Promise<void> {
  const arg = ctx.arg;
  if (!arg.trim()) {
    await ctx.reply('用法：/broadcast <文案>');
    return;
  }
  const ids = (await collectUserIds(ctx.env)).map((r) => r.id);
  if (ids.length === 0) {
    await ctx.reply('没有可群发的用户。');
    return;
  }
  const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await ctx.env.TASK_QUEUE.send({
    type: 'broadcast',
    id: jobId,
    msgId: jobId,
    ids,
    text: arg.trim(),
    parseMode: undefined,
  });
  if (ctx.from) await appendLog(ctx.env, `📣 发起群发给 ${ids.length} 人（${jobId}）by ${ctx.from.id}`);
  await ctx.reply(`📣 已加入队列：将向 <b>${ids.length}</b> 位用户群发。任务 ID：<code>${jobId}</code>`);
}

/** /notify <用户ID> <文案> */
export async function cmdNotify(ctx: Ctx): Promise<void> {
  const [idStr, ...rest] = ctx.arg.trim().split(/\s+/);
  const id = Number(idStr);
  const text = rest.join(' ');
  if (!Number.isInteger(id) || id <= 0 || !text) {
    await ctx.reply('用法：/notify <用户ID> <文案>');
    return;
  }
  await ctx.env.TASK_QUEUE.send({ type: 'notify', chatId: id, text, parseMode: undefined });
  await ctx.reply(`✅ 已加入队列推送消息给 <b>${id}</b>。`);
}

// ---------------- 广告关键词过滤 ----------------

/** /addad 关键词 */
export async function cmdAddAd(ctx: Ctx): Promise<void> {
  const kw = ctx.arg.trim();
  if (!kw) {
    await ctx.reply('用法：/addad <关键词>（要添加到广告过滤的关键词）');
    return;
  }
  const cfg = await getConfig(ctx.env);
  if (cfg.adblock.keywords.includes(kw)) {
    await ctx.reply(`⚠️ 关键词「${esc(kw)}」已在过滤列表中。`);
    return;
  }
  cfg.adblock.keywords.push(kw);
  await setConfigOverlay(ctx.env, { adblock: cfg.adblock });
  await ctx.reply(`✅ 已添加广告关键词：<code>${esc(kw)}</code>（当前 ${cfg.adblock.keywords.length} 个）`);
  if (ctx.from) await appendLog(ctx.env, `🛡 添加广告词「${kw}」by ${ctx.from.id}`);
}

/** /delad 关键词 */
export async function cmdDelAd(ctx: Ctx): Promise<void> {
  const kw = ctx.arg.trim();
  if (!kw) {
    await ctx.reply('用法：/delad <关键词>（从广告过滤列表移除）');
    return;
  }
  const cfg = await getConfig(ctx.env);
  const idx = cfg.adblock.keywords.indexOf(kw);
  if (idx === -1) {
    await ctx.reply(`⚠️ 关键词「${esc(kw)}」不在过滤列表中。`);
    return;
  }
  cfg.adblock.keywords.splice(idx, 1);
  await setConfigOverlay(ctx.env, { adblock: cfg.adblock });
  await ctx.reply(`✅ 已移除广告关键词：<code>${esc(kw)}</code>（当前 ${cfg.adblock.keywords.length} 个）`);
  if (ctx.from) await appendLog(ctx.env, `🛡 移除广告词「${kw}」by ${ctx.from.id}`);
}

/** /adlist 查看广告关键词列表 */
export async function cmdAdList(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  const kws = cfg.adblock.keywords;
  if (kws.length === 0) {
    await ctx.reply('📋 广告过滤列表为空。');
    return;
  }
  const list = kws.map((k, i) => `${i + 1}. <code>${esc(k)}</code>`).join('\n');
  await ctx.reply(
    `🛡 <b>广告过滤关键词</b>（共 ${kws.length} 个）\n` +
    `状态：${cfg.adblock.enabled ? '✅ 已启用' : '❌ 已禁用'}\n` +
    `动作：${cfg.adblock.action === 'delete' ? '仅删除' : '删除+踢人'}\n\n` +
    list
  );
}

/** /adblock on/off/status */
export async function cmdAdBlock(ctx: Ctx): Promise<void> {
  const arg = ctx.arg.trim().toLowerCase();
  const cfg = await getConfig(ctx.env);
  if (arg === 'on') {
    cfg.adblock.enabled = true;
  } else if (arg === 'off') {
    cfg.adblock.enabled = false;
  } else if (arg === 'ban') {
    cfg.adblock.action = 'delete_and_ban';
  } else if (arg === 'del') {
    cfg.adblock.action = 'delete';
  }
  await setConfigOverlay(ctx.env, { adblock: cfg.adblock });
  await ctx.reply(
    `🛡 广告过滤状态：\n` +
    `・启用：${cfg.adblock.enabled ? '✅ 是' : '❌ 否'}\n` +
    `・动作：${cfg.adblock.action === 'delete' ? '仅删除消息' : '删除并踢出'}\n` +
    `・关键词数：${cfg.adblock.keywords.length}\n\n` +
    `命令：<code>/adblock on/off</code> 开关\n` +
    `　　　<code>/adblock del/ban</code> 切换动作\n` +
    `　　　<code>/addad 关键词</code> 添加\n` +
    `　　　<code>/delad 关键词</code> 删除\n` +
    `　　　<code>/adlist</code> 查看列表`
  );
}

async function collectUserIds(env: Env): Promise<{ id: number }[]> {
  const res = await env.DB.prepare("SELECT id FROM users WHERE is_banned = 0 AND status = 'active'").all<{ id: number }>();
  return res.results ?? [];
}

// ---------------- 操作日志（KV 存储） ----------------

const LOG_KV_KEY = 'bot:log:v1';

export async function readLogs(env: Env): Promise<string[]> {
  try {
    const raw = await env.KV.get(LOG_KV_KEY);
    if (!raw) return [];
    return raw.split('\n');
  } catch {
    return [];
  }
}

export async function appendLog(env: Env, line: string): Promise<void> {
  try {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const prev = (await readLogs(env)).slice(-200);
    prev.push(`[${now}] ${line}`);
    await env.KV.put(LOG_KV_KEY, prev.join('\n'), { expirationTtl: 86400 * 30 });
  } catch {
    /* ignore */
  }
}