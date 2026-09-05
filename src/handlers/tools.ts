import type { Ctx } from '../ctx';
import { getConfig } from '../config';
import { btn } from '../telegram';
import { b64Encode, b64Decode, jsonBeautify, jsonMinify, dnsQuery, pingHost, queryIp } from '../utils/network';
import { esc, splitLong } from '../utils/text';
import type { Env } from '../env';

export type PendingTool =
  | { t: 'base64'; d: 'encode' | 'decode' }
  | { t: 'json'; d: 'beautify' | 'minify' }
  | { t: 'dns'; d: string }
  | { t: 'ping'; d: string };

const PREFIX = 'pending:tool:';
const pendKey = (uid: number) => PREFIX + uid;

export async function setPending(env: Env, uid: number, state: PendingTool, ttl = 600): Promise<void> {
  await env.KV.put(pendKey(uid), JSON.stringify(state), { expirationTtl: ttl });
}

export async function getPending(env: Env, uid: number): Promise<PendingTool | null> {
  try {
    const raw = await env.KV.get(pendKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as PendingTool;
  } catch {
    return null;
  }
}

export async function clearPending(env: Env, uid: number): Promise<void> {
  await env.KV.delete(pendKey(uid));
}

/** 工具箱主键盘 */
export function toolsKeyboard() {
  return [
    [btn('🔐 Base64 编解码', 'tl:b64')],
    [btn('🧾 JSON 整理', 'tl:json')],
    [btn('🌐 DNS 查询', 'tl:dns'), btn('📡 Ping 检测', 'tl:ping')],
    [btn('🌍 我的 IP', 'tl:ip')],
    [btn('⬅ 返回主菜单', 'menu:main')],
  ];
}

export async function showTools(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  void cfg;
  const text = [
    `🧰 <b>数码工具箱</b>`,
    ``,
    `可用工具：`,
    `　🔐 Base64 编码 / 解码`,
    `　🧾 JSON 格式化 / 压缩`,
    `　🌐 DNS 查询（A / AAAA / MX / TXT）`,
    `　📡 Ping / HTTP 延迟检测`,
    `　🌍 IP 归属查询`,
    ``,
    `点击下方按钮使用；或在私聊中直接输入命令，例如：`,
    `<code>/b64 encode 文本</code>`,
    `<code>/json {"a":1}</code>`,
    `<code>/dns example.com AAAA</code>`,
    `<code>/ping example.com</code>`,
    `<code>/ip</code>`,
  ].join('\n');
  await ctx.reply(text, { inlineKeyboard: toolsKeyboard() });
}

/** 处理回调型工具操作 */
export async function handleToolsCallback(ctx: Ctx, data: string): Promise<void> {
  const parts = data.split(':').filter(Boolean);
  if (parts.length < 2 || !ctx.from) return;
  const op = parts[1];

  switch (op) {
    case 'show':
      await showTools(ctx);
      return;
    case 'b64': {
      if (parts[2]) {
        const mode = parts[2];
        if (mode !== 'encode' && mode !== 'decode') return;
        await setPending(ctx.env, ctx.from.id, { t: 'base64', d: mode });
        await ctx.answer(mode === 'encode' ? '✅ 请发送要编码的文本' : '✅ 请发送要解码的 Base64', true);
      } else {
        await ctx.keypad('🔐 Base64 操作：', [
          [btn('⬆️ 编码', 'tl:b64:encode'), btn('⬇️ 解码', 'tl:b64:decode')],
          [btn('⬅ 返回工具箱', 'tl:show')],
        ]);
      }
      return;
    }
    case 'json': {
      if (parts[2]) {
        const d = parts[2] as 'beautify' | 'minify';
        await setPending(ctx.env, ctx.from.id, { t: 'json', d });
        await ctx.answer('✅ 请发送 JSON 内容', true);
      } else {
        await ctx.keypad('🧾 JSON 操作：', [
          [btn('🪄 格式化', 'tl:json:beautify'), btn('🗜️ 压缩', 'tl:json:minify')],
          [btn('⬅ 返回工具箱', 'tl:show')],
        ]);
      }
      return;
    }
    case 'dns':
      await setPending(ctx.env, ctx.from!.id, { t: 'dns', d: 'A' });
      await ctx.answer('✅ 请发送要查询的域名（可附加记录类型）', true);
      return;
    case 'ping':
      await setPending(ctx.env, ctx.from.id, { t: 'ping', d: '' });
      await ctx.answer('✅ 请发送要检测的域名 / IP', true);
      return;
    case 'ip': {
      await ctx.answer('查询中…');
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
          { inlineKeyboard: [[btn('🔄 刷新', 'tl:ip'), btn('⬅ 返回工具箱', 'tl:show')]] }
        );
      } catch (e) {
        await ctx.reply(`查询失败：${escMessage(e)}`, { inlineKeyboard: [[btn('⬅ 返回工具箱', 'tl:show')]] });
      }
      return;
    }
    default:
      return;
  }
}

/** 普通消息消费待处理工具 */
export async function handleToolInput(ctx: Ctx, input: string): Promise<void> {
  const state = await getPending(ctx.env, ctx.from!.id);
  if (!state) return;
  await clearPending(ctx.env, ctx.from!.id);

  const body = input.slice(0, 8000);
  try {
    switch (state.t) {
      case 'base64': {
        const out = state.d === 'encode' ? b64Encode(body) : b64Decode(body);
        await ctx.reply(
          `<b>${state.d === 'encode' ? '编码' : '解码'}结果：</b>\n<code>${esc(out.slice(0, 3800))}</code>`,
          { inlineKeyboard: [[btn('⬅ 返回工具箱', 'tl:show')]] }
        );
        break;
      }
      case 'json': {
        const out = state.d === 'beautify' ? jsonBeautify(body) : jsonMinify(body);
        for (const part of splitLong(out, 3800)) {
          await ctx.reply(`<code>${esc(part)}</code>`);
        }
        await ctx.reply('处理完成 ✅', { inlineKeyboard: [[btn('⬅ 返回工具箱', 'tl:show')]] });
        break;
      }
      case 'dns': {
        const parts = body.trim().split(/\s+/);
        const domain = parts[0];
        const type = ((parts[1] ?? state.d) || 'A').toUpperCase();
        if (!domain) throw new Error('请输入域名');
        const answers = await dnsQuery(domain, type);
        const lines = answers.map((a) => `　● <code>${esc(a.data)}</code>　<code>${a.type}</code> TTL ${a.TTL}`);
        await ctx.reply(
          [`🌐 DNS 查询：<b>${esc(domain)}</b> <code>${type}</code>`, ...lines].join('\n'),
          { inlineKeyboard: [[btn('⬅ 返回工具箱', 'tl:show')]] }
        );
        break;
      }
      case 'ping': {
        const result = await pingHost(body);
        await ctx.reply(
          [
            `📡 Ping 检测：<b>${esc(result.host)}</b>`,
            `　HTTP 状态：${result.httpStatus !== null ? `<code>${result.httpStatus}</code>` : '❌ 不可达'}`,
            `　延迟：<b>${result.latencyMs}ms</b>`,
          ].join('\n'),
          { inlineKeyboard: [[btn('⬅ 返回工具箱', 'tl:show')]] }
        );
        break;
      }
    }
  } catch (e) {
    await ctx.reply(`⚠️ 处理失败：${escMessage(e)}`, {
      inlineKeyboard: [[btn('⬅ 返回工具箱', 'tl:show')]],
    });
  }
}

function escMessage(e: unknown): string {
  return esc(e instanceof Error ? e.message : String(e));
}