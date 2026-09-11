# 📺 YouTube 新视频自动推送 · 完整教程

> 覆盖**数码解码机器人** YouTube 自动推送功能的：功能概述、实现原理、部署配置、命令详解、运维排错与踩坑记录。
> 面向：部署者 / 维护者。普通用户只需看「快速开始」一节。

---

## 一、功能概述

频道 **[@DECODING-w7d](https://www.youtube.com/@DECODING-w7d)** 发布新视频后，机器人会：

1. 每 **30 分钟**（Cloudflare Cron `*/30 * * * *`）自动检查一次频道；
2. 发现**没推过的新视频**，立即推送到绑定的粉丝群；
3. **不重复推送**已经推过的视频；
4. 没有新视频时**完全静默**，不打扰群成员；
5. 全流程无人工干预，全部运行在 Cloudflare Workers 免费额度内。

推送消息格式：

```text
🎬 频道更新啦！新视频发布

📢 《视频标题》
▶️ https://youtu.be/xxxxxxxxxxx

📚 更多教程：https://www.youtube.com/@DECODING-w7d
```

---

## 二、快速开始（3 步）

| 步骤 | 操作 | 说明 |
| --- | --- | --- |
| 1️⃣ | 把机器人拉进粉丝群，在群里发送 `/youtube announce` | 绑定本群为通知群 |
| 2️⃣ | 发送 `/youtube id UCxxxxxxxxxxxxxxxxxxxxxx` | 设置频道 ID 并**实时验证**（推荐） |
| 3️⃣ | 发送 `/youtube test` | 立即推送最新一条视频，验证效果 |

完成后无需再操作。之后**下一次频道发布新视频**时，机器人会在 30 分钟内自动推送。

> 💡 第 2 步跳过也没关系：机器人会自动从 `youtube.channelUrl` 解析频道 ID。

---

## 三、命令详解

| 命令 | 作用域 | 说明 |
| --- | --- | --- |
| `/youtube` | 任意聊天 | 状态面板：当前频道、绑定群、检查频率 |
| `/youtube announce` | **群聊** | 绑定本群为通知群（写入 `youtube.announceChatId`） |
| `/youtube id UC…` | 任意聊天 | 设置频道 ID，对候选 ID 做**智能纠错 + 实测验证** |
| `/youtube test` | 任意聊天 | 无视游标，**立即**推送最新一条视频到当前聊天 |
| `/youtube check` | 任意聊天 | 按正常去重逻辑检查一次，有新视频则推送到**绑定群** |

---

## 四、频道 ID（UC…）怎么获取

频道 ID 是 **`UC` 开头 + 22 位字符，共 24 位**，例如本项目的：

```text
UCffPrldpcuZNeYbzeZ8udxg
```

获取方法（任选其一）：

1. **网页源代码法（最可靠）**
   1. 电脑浏览器打开频道页面；
   2. 右键 → 查看网页源代码；
   3. `Ctrl+F` 搜索 `"browseId"` 或 `channel/UC`；
   4. 复制 `UC` 开头的 24 位字符。
2. **RSS 法**：打开 `https://www.youtube.com/feeds/videos.xml?channel_id=UC…`，能返回 XML 即 ID 正确。
3. **直接交给机器人**：把频道页链接或整段源代码发给 `/youtube id …`，机器人会自己提取并验证。

---

## 五、实现原理（多级兜底）

### 5.1 数据流

```text
resolveCandidates()
  ├── 1) KV 中已验证的 yt:channelId（最优，命中即用）
  ├── 2) KV 缓存的 yt:channelCandidates
  ├── 3) URL 中直接是 /channel/UC…
  └── 4) 从频道页 HTML 解析（canonical / externalId / itemprop / browseId / channelId）
        │
        ▼
fetchVideosForId(id)
  ├── 1) RSS: feeds/videos.xml?channel_id=UC…
  ├── 2) RSS: feeds/videos.xml?playlist_id=UU…（uploads 播放列表）
  └── 3) 兜底：解析频道 /videos 页面 HTML
        │
        ▼
去重（yt:lastVideoId + yt:lastPublished）
        │
        ▼
Telegram Bot API sendMessage → 绑定群
```

### 5.2 为什么需要这么多兜底？

**关键坑 1：Worker 出口请求 YouTube RSS 可能整体不可达。**
实测从 Cloudflare Workers 出口请求 `feeds/videos.xml?channel_id=UC…`，**对任意频道**都返回 `404`；`playlist_id=UU…` 返回 `500`。
这**不代表频道 ID 错了** —— 必须用一个「已知正确的对照频道」在**同一条链路上**复测，才能区分是「ID 错」还是「出口被封」。
本项目实测结论：**是出口问题，不是 ID 问题**。因此频道页 HTML 解析成为唯一可用路径。

**关键坑 2：`User-Agent` 必须伪装成浏览器。**
Workers 的 `fetch` 默认**不带 `User-Agent`**，YouTube 对这种「裸请求」会直接返回 404。代码统一使用 `YT_HEADERS`：

```ts
const YT_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'application/xml,text/xml,text/html,application/xhtml+xml,*/*;q=0.8',
};
```

**关键坑 3：YouTube 频道页已迁移到新版结构。**
新版页面用 `lockupViewModel`，视频 ID 在 `"contentId":"<11位>"`，标题在 `"lockupMetadataViewModel":{"title":{"content":"…"}}`；
旧版用 `videoRenderer` + `title.runs[].text`。
`parseChannelPage()` **两种都兼容**，新版优先、旧版兜底（实测新版页面上 `lockupViewModel` 出现 31 次，`videoRenderer` 为 0）。

**关键坑 4：抓取失败绝不能删缓存。**
早期版本在抓取失败时直接删除 `yt:channelId`，于是一次网络抖动 = 永久退化（下次只能重新爬页面，越修越坏）。
现在只有 `channelExists()` 明确返回 **404**（频道真的不存在）时才清理；`403 / 429 / 网络异常` 一律**保留**。

---

## 六、去重与游标机制

### 6.1 KV 状态键

| 键 | 作用 | TTL |
| --- | --- | --- |
| `yt:channelId` | **已验证**的频道 ID（最优先使用） | 30 天（用 `/youtube id` 重设则为 365 天） |
| `yt:channelCandidates` | 从频道页解析出的候选 ID 列表 | 30 天 |
| `yt:lastPublished` | 最新一条视频的发布时间（ISO），**只允许前移** | 永久 |
| `yt:lastVideoId` | 最新一条视频的 ID，用于**精确去重** | 永久 |

### 6.2 三种模式

| 模式 | 触发条件 | 行为 |
| --- | --- | --- |
| **首次运行** | `yt:lastPublished` 与 `yt:lastVideoId` **都不存在** | 只记录游标，**不回推历史视频**（避免刷屏） |
| **正常模式** | 存在任一游标 | 过滤掉 `videoId === yt:lastVideoId`；若有时间戳再要求 `published > yt:lastPublished` |
| **测试模式** | `/youtube test`（`forceLatest = true`） | 无视游标，**始终推送**最新一条 |

### 6.3 游标推进规则

```ts
// 时间游标：只在拿到 ISO 时间戳且确实更新时才前移，避免回退造成重复推送
if (isIso(newest) && (!last || newest.published > last)) {
  await env.KV.put(LAST_KEY, newest.published);
}
// 视频 ID 游标：总是对齐到当前最新一条
await env.KV.put(LAST_ID_KEY, newest.videoId);
```

> ⚠️ **注意**：HTML 兜底抓取**没有时间戳**（`published` 为空字符串）。此时**只更新 `yt:lastVideoId`，不动 `yt:lastPublished`** —— 这是**设计如此，不是 bug**。
> 实际表现就是：`yt:lastPublished` 可能还停留在 09-09，而 `yt:lastVideoId` 已经是 09-11 的视频。

---

## 七、部署与配置

### 7.1 前置资源

| 资源 | 绑定名 | 本项目值 |
| --- | --- | --- |
| Workers | — | `digi-decoder-bot` |
| D1 | `DB` | `digi-decoder-db` |
| KV | `KV` | `cc6db9573aa541aeaed7014e0c7aa6b3` |
| Queues | `TASK_QUEUE` | `bot-queue` |
| Workers AI | `AI` | `@cf/meta/llama-3.2-3b-instruct` |

### 7.2 Cron 触发器（`wrangler.jsonc`）

```jsonc
"triggers": {
  "crons": ["0 5 1 * *", "*/30 * * * *"]
}
```

- `*/30 * * * *` → 每 30 分钟：**YouTube 新视频检查**
- `0 5 1 * *` → 每月 1 日 05:00：月度 R2 备份

### 7.3 `scheduled` 入口（`src/index.ts`）

```ts
async scheduled(_event: unknown, env: Env): Promise<void> {
  // YouTube 新视频检查（每 30 分钟 cron 触发），错误落库不影响其他任务
  try {
    const ytCfg = await (await import('./config')).getConfig(env);
    const target = ytCfg.youtube.announceChatId || undefined;
    if (target) await checkNewVideos(env, target, false); // forceLatest = false
  } catch (e) {
    // 写入 D1 settings 表，key 形如 yt-error:<时间戳>
  }
  // …R2 月度备份…
}
```

> **重点**：`announceChatId` 为空时**直接跳过**（不会报错）。所以务必先 `/youtube announce` 绑定群。

### 7.4 频道配置（`src/config.ts`）

```ts
youtube: {
  channelUrl: 'https://www.youtube.com/@DECODING-w7d',
  announceChatId: '',   // 通过 /youtube announce 写入 KV overlay
}
```

线上可热更新，无需重新部署：

```text
/setjson {"youtube":{"channelUrl":"https://www.youtube.com/@你的频道"}}
```

---

## 八、运维与排错

### 8.1 查看 KV 游标（PowerShell）

```powershell
npx wrangler kv key get "yt:channelId"      --namespace-id=cc6db9573aa541aeaed7014e0c7aa6b3 --remote
npx wrangler kv key get "yt:lastVideoId"    --namespace-id=cc6db9573aa541aeaed7014e0c7aa6b3 --remote
npx wrangler kv key get "yt:lastPublished"  --namespace-id=cc6db9573aa541aeaed7014e0c7aa6b3 --remote
```

### 8.2 查看 cron 报错（D1）

```sql
SELECT key, value, updated_at
FROM settings
WHERE key LIKE 'yt-error:%'
ORDER BY updated_at DESC
LIMIT 20;
```

### 8.3 手动触发一次

```text
/youtube check    # 按正常逻辑检查（推送到绑定群）
/youtube test     # 强制推最新一条到当前聊天（跳过游标）
```

### 8.4 常见问题

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| `RSS 请求全部失败：解析到的 N 个频道 ID 均无效` | YouTube 临时限流 / Worker 出口被判定为数据中心 IP | 代码已走频道页兜底；稍后重试。**频道 ID 会保留，无需重设** |
| YouTube RSS 返回 404 | 缺 `User-Agent`（对**所有**频道都 404，不代表 ID 错） | 已内置浏览器化请求头 `YT_HEADERS` |
| 频道页能打开但解析不到视频 | YouTube 页面结构变更 | 已兼容 `lockupViewModel`（新版）与 `videoRenderer`（旧版） |
| 抓取失败后频道 ID 消失 | 旧版本 bug：失败即删缓存 | 已修复为**仅硬 404 才清缓存** |
| 群里没收到推送 | 未绑定通知群 / 已推过 / 无新视频 | `/youtube` 看状态 → `/youtube announce` 绑定 → `/youtube check` 手动触发 |
| 同一条视频推了两次 | 游标被回退 | 时间游标现在**只前移**；如仍复现，检查是否有并发写入 |
| 机器人报 `can't parse entities` | 标题含 Telegram 不支持的 HTML 标签 | 已内置 `escTitle()` 转义 |

### 8.5 本地无法访问 YouTube 怎么办

本项目开发机曾**完全无法访问 Google/YouTube**，所有验证都必须通过**部署后的 Worker 出口**完成。
临时做法：在 `src/index.ts` 挂一个诊断端点（如 `/debug/yt`），部署后访问它观察真实抓取结果，**验证完务必删除并重新部署**。

---

## 九、文件与代码索引

| 文件 | 职责 |
| --- | --- |
| `src/index.ts` | Worker 入口：`fetch`（webhook）/ `queue` / **`scheduled`（cron）** |
| `src/handlers/youtube.ts` | 本功能全部逻辑：候选解析、多级抓取、页面解析、去重、推送、命令处理 |
| `src/config.ts` | `youtube.channelUrl` / `youtube.announceChatId` 默认值 + KV overlay |
| `wrangler.jsonc` | Cron 触发器、KV/D1/Queues/AI 绑定 |

`src/handlers/youtube.ts` 关键函数：

| 函数 | 作用 |
| --- | --- |
| `resolveCandidates()` | 收集候选频道 ID（KV 优先 → URL → 页面解析） |
| `fetchLatestVideos()` | 遍历候选 ID，返回可用视频列表；含非破坏性缓存策略 |
| `fetchVideosForId()` | 单 ID 多端点尝试（RSS channel_id → RSS playlist_id → 频道页） |
| `fetchVideosFromChannelPage()` | 频道 `/videos` 页面兜底抓取 |
| `parseChannelPage()` | 解析 `lockupViewModel`（新）/ `videoRenderer`（旧） |
| `channelExists()` | 区分「ID 真失效(404)」与「只是被限流(403/429)」 |
| `checkNewVideos()` | 去重 + 游标推进 + 推送（cron 与命令共用） |
| `botSendMessage()` | 直连 Bot API 发消息（供 cron 使用，不依赖 ctx） |

---

## 十、踩坑记录（真实事故复盘）

1. **把「出口被封」误判为「频道 ID 错误」** —— 修复：必须用对照频道在同链路复测。
2. **抓取失败即删除已验证缓存** —— 修复：改为仅硬 404 才清缓存。
3. **页面改版导致正则静默失效**（`videoRenderer` → `lockupViewModel`）—— 修复：双结构兼容。
4. **`forceLatest` 被去重逻辑误过滤**，导致 `/youtube test` 不推送 —— 修复：测试模式完全绕过游标。
5. **时间游标回退造成重复推送** —— 修复：`yt:lastPublished` 只允许前移。
6. **无时间戳兜底抓取污染时间游标** —— 修复：仅当存在 ISO 时间戳时才写 `yt:lastPublished`。

---

## 十一、安全提示

- 仓库中的 `push-to-github.cjs` 曾**硬编码 GitHub Token**。该文件已被排除在上传之外，且脚本已支持 `process.env.GH_TOKEN`。
- **强烈建议**：立即在 GitHub 后台 **吊销旧 Token**，改用环境变量：
  ```powershell
  $env:GH_TOKEN = "ghp_你的新token"
  node push-to-github.cjs
  ```
- 永远不要把 `.dev.vars` / `.env` 提交进仓库（已在 `.gitignore` 中）。

---

*最后更新：2026-09-11 · 对应部署版本 `657e0ae5-3272-4aec-8019-797e79e88f40`*