import type { Ctx } from '../ctx';
import { getConfig, setConfigOverlay } from '../config';

const CHANNEL_ID_KEY = 'yt:channelId';
const CANDIDATES_KEY = 'yt:channelCandidates';
const LAST_KEY = 'yt:lastPublished';

export interface RssEntry {
  videoId: string;
  title: string;
  published: string; // ISO 时间
}

/**
 * 从频道页面收集候选频道 ID（UC...）。
 * YouTube 页面 HTML 中包含大量其他频道的 ID，所以收集多个候选，
 * 之后逐个用 RSS 验证，直到找到能用的。
 */
async function resolveCandidates(env: Ctx['env'], channelUrl: string): Promise<string[]> {
  // 已验证过的频道 ID 最优先
  const verified = await env.KV.get(CHANNEL_ID_KEY);
  if (verified) return [verified];

  const cached = await env.KV.get(CANDIDATES_KEY);
  if (cached) {
    try {
      const arr = JSON.parse(cached) as string[];
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch { /* 缓存损坏，重新解析 */ }
  }

  // 已是 /channel/UC... 形式则直接用
  const direct = channelUrl.match(/channel\/(UC[\w-]{22})/)?.[1];
  if (direct) return [direct];

  const handle = channelUrl.match(/youtube\.com\/@([\w.-]+)/)?.[1];
  if (!handle) return [];

  // YouTube 对数据中心 IP 可能返回精简 HTML，
  // 所以多试几个页面变体，并从多种字段提取频道自身 ID
  const urls = [
    `https://www.youtube.com/@${handle}`,
    `https://www.youtube.com/@${handle}/about`,
    `https://www.youtube.com/@${handle}/videos`,
  ];
  const candidates: string[] = [];
  const push = (id: string | undefined) => {
    if (id && !candidates.includes(id)) candidates.push(id);
  };

  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      // 频道自身 ID 的多种出现位置（按可靠性排序）
      push(html.match(/<link[^>]*rel="canonical"[^>]*href="[^"]*\/channel\/(UC[\w-]{22})"/)?.[1]);
      push(html.match(/"externalId":"(UC[\w-]{22})"/)?.[1]);
      push(html.match(/<meta[^>]*itemprop="identifier"[^>]*content="(UC[\w-]{22})"/)?.[1]);
      push(html.match(/"browseId":"(UC[\w-]{22})"/)?.[1]);
      for (const m of html.matchAll(/"channelId":"(UC[\w-]{22})"/g)) push(m[1]);
    } catch { /* 单个页面失败不影响其他变体 */ }
  }

  if (candidates.length > 0) {
    await env.KV.put(CANDIDATES_KEY, JSON.stringify(candidates), { expirationTtl: 30 * 86400 });
  }
  return candidates;
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

/** 拉取频道 RSS：逐个尝试候选频道 ID，直到某个 RSS 请求成功且返回视频 */
export async function fetchLatestVideos(env: Ctx['env'], channelUrl: string): Promise<RssEntry[]> {
  const candidates = await resolveCandidates(env, channelUrl);
  if (candidates.length === 0) throw new Error('无法从频道页面解析频道 ID，请确认频道地址正确');

  for (const id of candidates) {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
    if (!res.ok) continue; // 404 等错误 → 换下一个候选
    const xml = await res.text();
    const entries = parseRss(xml);
    if (entries.length > 0) {
      // 验证成功：缓存这个可用的频道 ID（30 天）
      await env.KV.put(CHANNEL_ID_KEY, id, { expirationTtl: 30 * 86400 });
      return entries;
    }
  }

  // 全部失败 → 清空缓存，下次定时任务重新解析
  await env.KV.delete(CANDIDATES_KEY);
  await env.KV.delete(CHANNEL_ID_KEY);
  throw new Error(`RSS 请求全部失败：解析到的 ${candidates.length} 个频道 ID 均无效，请确认频道地址`);
}

function parseRss(xml: string): RssEntry[] {
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

  const videos = await fetchLatestVideos(env, channelUrl);
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
  // 注意：保留原始大小写（频道 ID 区分大小写），分支匹配时再转小写
  const raw = ctx.arg.trim();
  const arg = raw.toLowerCase();
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

  // 手动设置频道 ID（自动解析失败时的兜底）
  // 注意：ID 区分大小写，用 raw（未转小写）提取
  if (arg.startsWith('id ')) {
    const idInput = raw.slice(3).trim();
    const candidates = new Set<string>();
    // 1) 标准连续 24 位子串
    for (let i = 0; i + 24 <= idInput.length; i++) {
      const sub = idInput.slice(i, i + 24);
      if (/^UC[\w-]{22}$/.test(sub)) candidates.add(sub);
    }
    // 2) 智能纠错：输入是 UC 开头的 25~26 位时，尝试"删除任意一个字符"的所有 24 位组合
    //    （多复制了一个字符 / 转录错了一个字符，都能自动纠正）
    if (/^UC[\w-]{23,26}$/.test(idInput) && idInput.length > 24) {
      for (let i = 0; i < idInput.length; i++) {
        const sub = idInput.slice(0, i) + idInput.slice(i + 1);
        if (/^UC[\w-]{22}$/.test(sub)) candidates.add(sub);
      }
    }
    if (candidates.size === 0) {
      await ctx.reply(
        '⚠️ 没有在输入中找到有效的频道 ID。\n格式：UC 开头 + 22 位字符，共 24 位。\n\n如何查找：\n1️⃣ 电脑浏览器打开你的频道页面\n2️⃣ 右键 → 查看网页源代码\n3️⃣ Ctrl+F 搜索 <code>"browseId"</code> 或 <code>channel/UC</code>\n4️⃣ 复制 UC 开头的 24 位字符\n\n然后发送：/youtube id UCxxxxxxxxxxxxxxxxxxxxxx'
      );
      return;
    }
    // 逐个候选实测 RSS 验证（最多 30 个，防止超时）
    const list = [...candidates].slice(0, 30);
    for (const id of list) {
      let ok = false;
      let latestTitle = '';
      try {
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
        if (res.ok) {
          const xml = await res.text();
          const entries = parseRss(xml);
          if (entries.length > 0) {
            ok = true;
            latestTitle = entries[0].title;
          }
        }
      } catch { /* 尝试下一个候选 */ }
      if (ok) {
        await ctx.env.KV.put(CHANNEL_ID_KEY, id, { expirationTtl: 365 * 86400 });
        // 清掉可能已失效的候选缓存
        await ctx.env.KV.delete(CANDIDATES_KEY);
        await ctx.reply(
          `✅ 频道 ID 已设置并验证成功！\n\n🆔 <code>${id}</code>\n📺 最新视频：<b>${escTitle(latestTitle)}</b>\n\n自动推送已就绪！发 <code>/youtube test</code> 可立即推送最新视频。`
        );
        return;
      }
    }
    await ctx.reply(
      `⚠️ 智能验证失败：尝试了 ${list.length} 种候选 ID，RSS 均无效。\n\n请重新精确复制频道 ID：\n1️⃣ 打开频道页面 → 右键 → 查看网页源代码\n2️⃣ Ctrl+F 搜索 <code>"browseId"</code>\n3️⃣ 只复制双引号里的内容（UC 开头）\n4️⃣ 重新发送 /youtube id ...`
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