import type { Ctx } from '../ctx';
import { getConfig, setConfigOverlay } from '../config';

const CHANNEL_ID_KEY = 'yt:channelId';
const LAST_KEY = 'yt:lastPublished';

export interface RssEntry {
  videoId: string;
  title: string;
  published: string; // ISO 时间
}

/** 把 handle（youtube.com/@xxx）解析成频道 ID（UC...），结果缓存 30 天 */
export async function resolveChannelId(env: Ctx['env'], channelUrl: string): Promise<string | null> {
  let cached = await env.KV.get(CHANNEL_ID_KEY);
  if (cached) return cached;

  // 已是 /channel/UC... 形式则直接取
  const direct = channelUrl.match(/channel\/(UC[\w-]{22})/);
  if (direct) {
    await env.KV.put(CHANNEL_ID_KEY, direct[1], { expirationTtl: 30 * 86400 });
    return direct[1];
  }

  // @handle 形式：抓取频道页面解析 channelId
  const handle = channelUrl.match(/youtube\.com\/@([\w.-]+)/)?.[1];
  if (!handle) return null;
  const res = await fetch(`https://www.youtube.com/@${handle}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TelegramBot)' },
  });
  if (!res.ok) throw new Error(`频道页面请求失败（HTTP ${res.status}）`);
  const html = await res.text();
  const id =
    html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ??
    html.match(/channel\/(UC[\w-]{22})/)?.[1] ??
    null;
  if (id) await env.KV.put(CHANNEL_ID_KEY, id, { expirationTtl: 30 * 86400 });
  return id;
}

/** XML 实体解码（标题里的 &amp; 等） */
function xmlDecode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escTitle(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 拉取频道 RSS 最新视频列表 */
export async function fetchLatestVideos(channelId: string): Promise<RssEntry[]> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  if (!res.ok) throw new Error(`RSS 请求失败（HTTP ${res.status}）`);
  const xml = await res.text();
  const entries: RssEntry[] = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = block.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
    const published = block.match(/<published>([^<]+)<\/published>/)?.[1] ?? '';
    if (videoId) entries.push({ videoId, title: xmlDecode(title), published });
  }
  return entries;
}

/** 通过 Bot API 直接发消息（绕过 ctx，供定时任务使用） */
async function botSendMessage(env: Ctx['env'], chatId: number | string, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('未配置 TELEGRAM_BOT_TOKEN');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: false }),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(data.description ?? `HTTP ${res.status}`);
}

/**
 * 检查新视频并推送。
 * - chatId 传入时，新视频 / test 模式的最新视频会推送到该聊天
 * - forceLatest=true（测试模式）：即使没有新视频也推送最新一条，用于验证
 * - 首次运行只记录不推送，避免刷旧视频
 */
export async function checkNewVideos(
  env: Ctx['env'],
  chatId: number | string | undefined,
  forceLatest = false
): Promise<RssEntry[]> {
  const cfg = await getConfig(env);
  const channelUrl = cfg.youtube.channelUrl || cfg.tutorials.channelUrl;
  const channelId = await resolveChannelId(env, channelUrl);
  if (!channelId) throw new Error('无法解析频道 ID，请确认 YouTube 频道地址正确');

  const videos = await fetchLatestVideos(channelId);
  if (videos.length === 0) return [];

  const last = await env.KV.get(LAST_KEY);
  let toPush: RssEntry[] = [];
  if (!last) {
    await env.KV.put(LAST_KEY, videos[0].published);
    if (forceLatest) toPush = [videos[0]];
  } else {
    toPush = videos.filter((v) => v.published > last);
    if (forceLatest && toPush.length === 0) toPush = [videos[0]];
  }

  if (toPush.length > 0) {
    const newest = toPush.reduce((a, b) => (a.published > b.published ? a : b));
    await env.KV.put(LAST_KEY, newest.published);
  }

  for (const v of toPush) {
    if (chatId === undefined) continue;
    const text =
      `🎬 <b>频道更新啦！新视频发布</b>\n\n` +
      `📢 <b>${escTitle(v.title)}</b>\n` +
      `▶️ https://youtu.be/${v.videoId}\n\n` +
      `📚 更多教程：${cfg.tutorials.channelUrl}`;
    await botSendMessage(env, chatId, text);
  }
  return toPush;
}

// ============ /youtube 命令（仅管理员） ============

export async function cmdYouTube(ctx: Ctx): Promise<void> {
  if (!ctx.isOwner && !ctx.isAdmin) {
    await ctx.reply('❌ 无管理员权限');
    return;
  }
  const arg = ctx.arg.trim().toLowerCase();
  const cfg = await getConfig(ctx.env);

  // 在粉丝群里绑定推送
  if (arg === 'announce') {
    if (!ctx.chat || !ctx.isGroup) {
      await ctx.reply('⚠️ 请在要接收新视频通知的粉丝群里发送：/youtube announce');
      return;
    }
    await setConfigOverlay(ctx.env, { youtube: { ...cfg.youtube, announceChatId: String(ctx.chat.id) } });
    await ctx.reply(
      `✅ 已绑定本群为 YouTube 新视频通知群（<code>${ctx.chat.id}</code>）。\n每 30 分钟自动检查频道，发现新视频立即推送到这里。`
    );
    return;
  }

  // 测试：推送最新一条到当前聊天
  if (arg === 'test') {
    await ctx.reply('🧪 测试：推送频道最新一条视频到本聊天…');
    try {
      const pushed = await checkNewVideos(ctx.env, ctx.chat!.id, true);
      await ctx.reply(pushed.length > 0 ? '✅ 测试推送完成（见上方消息）。' : '⚠️ 没有获取到视频，请稍后再试。');
    } catch (e) {
      await ctx.reply(`⚠️ 测试失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
    return;
  }

  // 手动检查一次并推送到绑定群
  if (arg === 'check') {
    const bound = cfg.youtube.announceChatId;
    if (!bound) {
      await ctx.reply('⚠️ 尚未绑定推送群。请在粉丝群里发送：/youtube announce');
      return;
    }
    await ctx.reply('📡 正在检查频道更新…');
    try {
      const pushed = await checkNewVideos(ctx.env, bound, false);
      await ctx.reply(
        pushed.length > 0
          ? `✅ 检查完成：发现并推送了 <b>${pushed.length}</b> 条新视频。`
          : '✅ 检查完成：暂无新视频。'
      );
    } catch (e) {
      await ctx.reply(`⚠️ 检查失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
    return;
  }

  // 状态面板
  await ctx.reply(
    [
      `📺 <b>YouTube 视频自动推送</b>`,
      ``,
      `🎬 频道：${cfg.youtube.channelUrl || cfg.tutorials.channelUrl}`,
      `📢 通知群：${cfg.youtube.announceChatId ? `<code>${cfg.youtube.announceChatId}</code>（已绑定）` : '未绑定'}`,
      `⏰ 检查频率：每 30 分钟（Cloudflare 定时任务）`,
      ``,
      `命令：`,
      `　<code>/youtube announce</code> 在群里绑定推送`,
      `　<code>/youtube test</code> 测试推送最新视频`,
      `　<code>/youtube check</code> 手动检查一次`,
    ].join('\n'),
    { inlineKeyboard: [[{ text: '🏠 打开频道', url: cfg.youtube.channelUrl }]] }
  );
}