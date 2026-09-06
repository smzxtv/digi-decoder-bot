# 🤖 数码解码机器人

> 基于 Cloudflare Serverless 生态的 Telegram 机器人 —— 零 VPS、零运维、全免费额度即可运行。

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange) ![D1](https://img.shields.io/badge/Cloudflare-D1-blue) ![Workers AI](https://img.shields.io/badge/Workers-AI-green) ![Telegram](https://img.shields.io/badge/Telegram-Bot-blueviolet)

- **线上机器人**：[@shuma_jiema_bot](https://t.me/shuma_jiema_bot)
- **视频教程频道**：[YouTube @DECODING-w7d](https://www.youtube.com/@DECODING-w7d)

## ✨ 技术架构

| 组件 | 用途 |
| --- | --- |
| Cloudflare **Workers** | 承载 Bot 逻辑，处理 Telegram Webhook |
| Cloudflare **D1** (SQLite) | 用户 / 签到 / 活动 / 教程数据 |
| Cloudflare **KV** | 配置热更新、速率限制、工具待处理状态 |
| Cloudflare **Queues** | 群发广播、消息推送等后台任务 |
| Cloudflare **Workers AI** | AI 智能问答（默认 llama-3.2-3b-instruct） |
| Telegram **Webhook** | 实时接收消息，附带幂等去重与错误落库 |

## 📋 功能总览

```text
🤖 数码解码机器人
├── 📝 每日签到（今日签到 / 连续签到 / 本月日历 / 签到排行）
├── 🧰 工具箱（IP / DNS / Ping / Base64 / URL / JSON + 在线工具）
├── 📚 教程中心（直连 YouTube 频道分类）
├── 🤖 AI 助手（AI问答 / 代码助手 / 文案助手 / 文本处理）
├── 🎁 幸运粉丝（每月抽奖送奖品，完整活动管理）
├── 🔥 签到排行
├── 🎁 邀请奖励
├── ❓ 帮助
└── ⚙️ 管理面板（仅管理员）
```

## 📝 每日签到

| 功能 | 说明 |
| --- | --- |
| 今日签到 | 每日基础奖励 **+8 解码点**，私聊发送 `/checkin` 或点菜单按钮 |
| 连续里程碑 | 连续 **7 天 +30**、**14 天 +60**、**30 天 +150**（达成当天一次性发放） |
| 本月签到 | 图形化日历视图：✅ 已签 / · 未签 / ▫️ 未来日期 |
| 签到排行 | 按解码点 + 累计签到天数排序的 Top 10 |
| 下一档预告 | 签到成功后自动提示距离下一个里程碑还差几天 |

签到子菜单支持按钮操作：`✅ 今日签到` `📅 本月签到` `🔥 签到排行榜` `🎁 幸运粉丝`。

## 🧰 工具箱

| 工具 | 命令 | 说明 |
| --- | --- | --- |
| 🔐 Base64 编解码 | `/b64 encode 文本` / `/b64 decode 内容` | 支持中文，UTF-8 安全 |
| 🔗 URL 编解码 | `/url encode 文本` / `/url decode 链接` | 百分号编码互转 |
| 🧾 JSON 整理 | `/json {"a":1}` | 格式化 / 压缩，自动分片长输出 |
| 🌐 DNS 查询 | `/dns example.com AAAA` | 基于 Cloudflare DoH (1.1.1.1)，支持 A/AAAA/MX/TXT |
| 📡 Ping 检测 | `/ping example.com` | HTTP 状态码 + 延迟毫秒数 |
| 🌍 IP 查询 | `/ip` | 出口 IP / 归属地 / 机房 / ASN |
| 🖼 图片压缩等 | 工具箱底部链接按钮 | 跳转 Squoosh、IT-Tools 等在线工具 |

所有工具同时支持**命令直接调用**与**面板按钮交互**（点击按钮后按提示发送内容即可，600 秒内有效）。

## 📚 教程中心

教程中心直接对接 **YouTube 频道**，分类按钮一键直达：

- 默认分类：`AI` `VPS` `Cloudflare` `Docker` `Linux` `网络技术` `软件教程`
- 默认频道：`https://www.youtube.com/@DECODING-w7d`

**修改频道地址**：编辑 `src/config.ts` 中的 `tutorials.channelUrl` 与 `tutorials.categories`，改完 `npm run deploy` 即生效。

> 💡 进阶：想让每个分类跳转到「频道内搜索结果」，把 `src/handlers/tutorials.ts` 里按钮的 `url` 改为 `` `${url}/search?q=${encodeURIComponent(c)}` ``。

## 🤖 AI 助手

基于 Cloudflare Workers AI（默认模型 `@cf/meta/llama-3.2-3b-instruct`），四种模式：

| 模式 | 示例 |
| --- | --- |
| 💬 AI 问答 | `/ai 什么是 DNS` |
| 👨‍💻 代码助手 | `/ai 帮我写一个 JS 快速排序` |
| ✍️ 文案助手 | `/ai 帮我写一条签到活动的宣传文案` |
| 📄 文本处理 | `/ai 把这段话翻译成英文：……` |

- 支持**回复某条消息 + `/ai`** 引用上下文提问
- 内置 HTML 标签转义，模型输出含非法标签也不会报错
- 频率限制默认 8 次/分钟（可在 `config.ts` 的 `ai.rateLimitPerMin` 调整）
- 私聊发送任意文字，AI 会作为兜底自动回复

## 🎁 幸运粉丝（完整活动管理）

每月抽奖活动系统，从创建到发货全流程闭环：

### 用户视角

- 主菜单「🎁 幸运粉丝」或任意聊天发送 `/lucky`
- 查看当前活动（奖品 / 名额 / 门槛）、自己的本月签到天数与资格状态、中奖名单
- 当月签到满门槛天数即**自动获得资格**，无需报名

### 管理流程（管理员）

```text
1️⃣ 创建活动  /lucky create 充电器|2|5|12月幸运粉丝
             （奖品|名额|门槛天数|活动名称，同时只能有一个进行中的活动）
2️⃣ 查看进度  管理面板显示当前活动信息 + 参与人数
3️⃣ 资格名单  [📋 资格名单] 查看所有符合条件用户及签到天数
4️⃣ 开奖      [🎲 开奖] 随机抽取，自动公布并关闭活动
5️⃣ 补抽      [🔄 补抽] 更换最后一名中奖者（弃奖 / 联系不上时用）
6️⃣ 发货管理  [📦 发货管理] 查看；/lucky ship 用户ID SF123456 登记快递单号
7️⃣ 历史活动  [📜 历史活动] 每期活动与中奖者永久留档
```

### 📢 开奖自动群公告

在粉丝群里发送一次 **`/lucky announce`** 绑定公告群，之后每次开奖自动推送结果到该群：

```text
🎉 幸运粉丝开奖啦！
🎫 活动：12月幸运粉丝
🏆 奖品：充电器 × 2
恭喜以下幸运粉丝：
🎊 Sm (@smjmtv)
📝 每日签到 /checkin，下个月也许就是你！
```

## 🎁 邀请奖励

- 发送 `/invite` 生成专属邀请链接（`t.me/你的bot?start=ref_你的ID`）
- 好友通过链接注册：**好友 +20、你 +35** 解码点（可在 config 调整）
- 防重复：同一好友只结算一次，自己邀请自己无效

## ⚙️ 管理面板

入口：`/admin` 或主菜单「⚙️ 管理面板」（仅管理员可见）

| 命令 | 功能 |
| --- | --- |
| `/stats` | 用户数 / 发行解码点 / 今日签到 / 未用兑换码 |
| `/ban 用户ID [原因]` / `/unban 用户ID` | 黑名单管理 |
| `/give 用户ID 数量` | 手动调整解码点 |
| `/gencode 面值 数量` | 批量生成兑换码，用户 `/redeem 码` 核销 |
| `/broadcast 文案` | 通过队列群发全部用户 |
| `/notify 用户ID 文案` | 单人私聊推送 |
| `/lucky ...` | 幸运粉丝活动管理（见上文） |
| `/cfg` / `/setjson {...}` / `/reload` | 查看配置 / 热更新配置（KV 持久化，无需重新部署）/ 重载 |
| `/log` | 查看操作日志 |
| `/tutorial` | （教程已改直连 YouTube，此命令仅保留面板入口） |

## 🚀 部署教程（从零到上线）

### 1. 准备资源（全部免费）

- **Telegram Bot**：找 [@BotFather](https://t.me/BotFather) 发 `/newbot`，记下 **Token**
- **你的 Telegram ID**：找 [@userinfobot](https://t.me/userinfobot) 发消息获取
- **Cloudflare 账号**：[dash.cloudflare.com](https://dash.cloudflare.com/signup)

### 2. 创建 Cloudflare 资源

```powershell
cd digi-decodbot
npx wrangler login          # 浏览器授权
npx wrangler d1 create digi-decoder-db      # 记下 database_id
npx wrangler kv namespace create KV         # 记下 id
npx wrangler queues create bot-queue
```

把拿到的 ID 填入 `wrangler.jsonc`（R2 备份为可选，未创建也能跑，定时备份会自动跳过）。

### 3. 建表（D1 控制台粘贴执行）

Cloudflare 控制台 → Workers & Pages → D1 → `digi-decoder-db` → **控制台**，执行 `migrations/` 目录下两个 SQL 文件的全部内容（`0001_init.sql` + `0002_lucky.sql`）。

> 💡 若本机 `npx wrangler d1 migrations apply --remote` 报 `SQLITE_AUTH`，直接用网页控制台建表最稳妥。

### 4. 存密钥 + 部署 + 绑定 Webhook

```powershell
npx wrangler secret put TELEGRAM_BOT_TOKEN   # 粘贴 Bot Token
npm run deploy                               # 部署上线
node scripts/set-webhook.mjs                 # 绑定 webhook
# 若网络不通，浏览器直接访问：
# https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://你的worker.workers.dev/webhook/bot
```

### 5. 验证

Telegram 里给 Bot 发 `/start`，看到主菜单即成功 🎉

### 本地开发

```powershell
Copy-Item .dev.vars.example .dev.vars   # 填入测试 Token
npm run db:migrate:local                # 本地建表
npm run dev                             # http://localhost:8787
```

## ⚙️ 配置说明（src/config.ts）

所有业务默认值集中在 `DEFAULT_CONFIG`：

| 配置项 | 说明 |
| --- | --- |
| `brand` | 机器人名称 / 积分名（解码点）/ 问候语 |
| `checkin.rewardPoints` | 每日签到奖励（默认 8） |
| `checkin.streakBonuses` | 连签里程碑数组，可无限加档 |
| `invite` | 邀请双方奖励点数 |
| `ai.model` / `promptSystem` | AI 模型与系统提示词 |
| `tools.moreTools` | 工具箱底部的外部在线工具按钮 |
| `tutorials.channelUrl` | 教程中心 YouTube 频道地址 |
| `tutorials.categories` | 教程分类按钮列表 |
| `lucky` | 幸运粉丝活动默认参数 |

线上临时调整可用管理员命令 `/setjson {...}` 热更新（存 KV，无需重新部署）。

## 🔧 常见问题（踩坑实录）

| 问题 | 原因与解决 |
| --- | --- |
| `SQLITE_AUTH` 建表失败 | 账号权限/网络问题 → 直接在 **D1 网页控制台**粘贴 SQL 建表 |
| Webhook 返回 500 | 数据库表结构与代码不一致 → 对照 `migrations/` 重建表 |
| AI 报模型已弃用 | Cloudflare 会下架旧模型 → 更新 `config.ts` 的 `ai.model`，可在[模型目录](https://developers.cloudflare.com/workers-ai/models/)查看可用列表 |
| `can't parse entities` | 消息含 Telegram 不支持的 HTML 标签 → 已内置自动转义，若复现检查自定义文案 |
| 国内网络连不上 GitHub / Telegram API | 用代理或手机热点；webhook 可用浏览器访问 setWebhook 链接代替 |
| 群里 Bot 没反应 | 确认已绑定 webhook（`getWebhookInfo` 查看）；命令在群里也可直接使用 |

## 📂 项目结构

```text
digi-decodbot/
├── src/
│   ├── index.ts            # Worker 入口：webhook / queue / scheduled
│   ├── dispatch.ts         # Telegram Update 总分发
│   ├── telegram.ts         # Bot API 封装（sendMessage / 按键等）
│   ├── config.ts           # 全部业务默认配置（改这里）
│   ├── db.ts               # D1 数据访问层
│   ├── middleware.ts       # 黑名单 + 速率限制
│   ├── ctx.ts              # 统一请求上下文
│   ├── queue.ts            # 后台队列消费（广播 / 推送）
│   └── handlers/
│       ├── menu.ts         # 主菜单
│       ├── checkin.ts      # 签到 / 本月日历
│       ├── points.ts       # 积分 / 排行 / 邀请 / 兑换码
│       ├── tools.ts        # 工具箱
│       ├── tutorials.ts    # 教程中心（YouTube 直连）
│       ├── aiChat.ts       # AI 助手
│       ├── lucky.ts        # 幸运粉丝活动管理
│       ├── commands.ts     # 命令表
│       ├── admin.ts        # 管理面板
│       └── adminCommands.ts# 管理命令注册
├── migrations/             # D1 建表 SQL
├── scripts/set-webhook.mjs # Webhook 绑定脚本
└── wrangler.jsonc          # Cloudflare 配置（填你的资源 ID）
```

## 📄 License

MIT —— 可自由用于自己的社群与频道，欢迎 Star ⭐
