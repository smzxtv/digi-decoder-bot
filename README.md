# 数码解码机器人 · Cloudflare 版

一个完全基于 **Cloudflare Serverless 生态** 构建的 Telegram 机器人，无 VPS、全 Serverless、高可用、低成本、易扩展。

## ✨ 特性

- 🆓 **完全免费**：Cloudflare 免费额度足够支撑中小规模使用
- 🌍 **全球加速**：Cloudflare 全球网络，低延迟
- 🔒 **安全可靠**：DDoS 防护 + WAF + 自动 SSL
- 📱 **无需服务器**：纯 Serverless，零运维
- 🤖 **功能丰富**：积分、签到、邀请、工具箱、AI 问答、广告过滤

---

## 🏗 架构

```
Telegram 用户
   │  Telegram Bot API (Webhook)
   ▼
Cloudflare 全球网络 ── DNS + WAF + DDoS 防护 + 速率限制
   │
   ├── Workers（主应用：命令 / 消息 / 回调 / 事件）
   │     ├── 命令处理器（/start /me /help /checkin /tools ...）
   │     ├── 业务逻辑（积分 / 签到 / 邀请 / 兑换码 / 教程 / 管理）
   │     └── 工具服务（IP / DNS / Ping / Base64 / JSON）
   │
   ├── D1 (SQLite)    用户 / 签到 / 邀请 / 订单 / 教程 / 黑名单
   ├── Workers KV     配置缓存 / 会话 / 速率限制 / 去重 / 日志
   ├── R2             备份 / 导出数据（可选）
   ├── Queues         耗时任务（群发广播 / 通知）
   └── Workers AI     智能问答助手
```

---

## 📋 功能列表

### 💰 积分系统
| 功能 | 命令 | 说明 |
| --- | --- | --- |
| 每日签到 | `/checkin` | 每天 +8 解码点 |
| 连续签到奖励 | — | 连续 7 天 +30，14 天 +60，30 天 +150 |
| 邀请好友 | `/invite` | 好友加入你 +35，好友 +20 |
| 兑换码 | `/redeem 兑换码` | 管理员生成的兑换码 |
| 我的积分 | `/me` | 查看积分、排行、连续天数 |
| 排行榜 | `/top` | 查看积分前 10 名 |

### 🛠 工具箱
| 功能 | 命令 | 说明 |
| --- | --- | --- |
| Base64 编解码 | `/b64 文本` | Base64 编码/解码 |
| JSON 格式化 | `/json` | JSON 格式化与压缩 |
| DNS 解析 | `/dns 域名` | 查询 DNS 记录 |
| Ping 检测 | `/ping IP/域名` | 网络连通性测试 |
| IP 信息 | `/ip IP地址` | 查询 IP 地理信息 |

### 📚 内容功能
| 功能 | 命令 | 说明 |
| --- | --- | --- |
| 教程中心 | `/tutorials` | 浏览教程分类和列表 |
| AI 问答 | `/ai 你的问题` | AI 智能回答 |
| 帮助 | `/help` | 查看所有命令 |

### 🎯 自动化功能
| 功能 | 触发方式 | 说明 |
| --- | --- | --- |
| FAQ 自动回复 | 私聊发关键词 | 发"签到""工具在哪"等自动回复 |
| 入群欢迎 | 拉 bot 进群 | 新成员进群自动欢迎 |
| 群聊 FAQ | 群聊发关键词 | 群聊里也自动回复常见问题 |
| 广告过滤 | 群聊消息 | 自动删除含广告词的消息 |

### 👨‍💼 管理功能（仅管理员）
| 功能 | 命令 | 说明 |
| --- | --- | --- |
| 数据统计 | `/stats` | 用户数、签到数、订单数 |
| 拉黑用户 | `/ban 用户ID` | 禁止用户使用 |
| 发放积分 | `/give 用户ID 数量` | 手动加积分 |
| 生成兑换码 | `/gencode 数量 积分数` | 批量生成兑换码 |
| 群发消息 | `/broadcast` | 给所有用户发消息 |
| 系统通知 | `/notify` | 发送系统通知 |
| 修改配置 | `/setjson` | 热更新配置（无需重新部署） |
| 查看日志 | `/log` | 查看系统日志 |
| 广告过滤管理 | `/addad /delad /adlist /adblock` | 管理广告关键词 |

---

## 🚀 快速开始

### 1. 准备

- 注册 [Cloudflare](https://dash.cloudflare.com/) 账号（免费）
- 安装 [Node.js](https://nodejs.org/) ≥ 18
- 在 [@BotFather](https://t.me/BotFather) 创建 bot，获取 `TELEGRAM_BOT_TOKEN`
- 在 Telegram 获取你的用户 ID（给 @userinfobot 发消息）

### 2. 克隆项目

```bash
git clone https://github.com/你的用户名/digi-decoder-bot.git
cd digi-decoder-bot
npm install
```

### 3. 创建 Cloudflare 资源

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create digi-decoder-db
# 输出: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# 创建 KV 命名空间
npx wrangler kv namespace create KV
# 输出: id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 创建消息队列
npx wrangler queues create bot-queue
```

### 4. 配置 wrangler.jsonc

把上一步拿到的 ID 填入 `wrangler.jsonc`：

```jsonc
{
  "vars": {
    "TELEGRAM_BOT_USERNAME": "你的bot用户名（不带@）",
    "DEFAULT_OWNER_ID": "你的Telegram数字ID",
    "ADMINS": "",
    "TIME_ZONE_OFFSET_HOURS": "8"
  },
  "d1_databases": [{
    "binding": "DB",
    "database_name": "digi-decoder-db",
    "database_id": "第3步拿到的D1 ID",
    "migrations_dir": "migrations"
  }],
  "kv_namespaces": [{
    "binding": "KV",
    "id": "第3步拿到的KV ID"
  }],
  "queues": {
    "producers": [{ "queue": "bot-queue", "binding": "TASK_QUEUE" }]
  }
}
```

### 5. 配置密钥

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# 粘贴你的 Bot Token，回车确认
```

### 6. 初始化数据库

```bash
npm run db:migrate -- --remote
```

### 7. 部署上线

```bash
npm run deploy
```

部署成功后会输出你的 Worker 地址：
```
https://digi-decoder-bot.你的子域名.workers.dev
```

### 8. 绑定 Webhook

```bash
node scripts\set-webhook.mjs
```

成功输出：
```
✅ webhook set: https://digi-decoder-bot.你的子域名.workers.dev/webhook/bot
```

---

## 🎮 使用

在 Telegram 里私聊你的 bot：

```
/start       进入主菜单
/checkin     每日签到领解码点
/me          查看我的积分
/top         排行榜
/invite      邀请好友得积分
/tools       工具箱
/ai 问题     AI 智能问答
/tutorials   教程中心
/help        帮助
```

---

## 🛡 广告过滤

把 Bot 拉进群并设为**管理员**（需要删除消息的权限），即可自动过滤广告。

### 默认广告关键词

```
加群、兼职、刷单、日赚、月赚、赚钱、免费领、扫码、加我、
薇信、vx、v信、代购、代理、招商、加盟、投资、理财、彩票、
博彩、赌、棋牌、稳赚、包赚、贷款、借款、信用卡套现、代开、
发票、加QQ、加微信、加V、加薇、加扣、招聘、诚聘、高薪、急聘、直聘
```

### 管理命令

| 命令 | 功能 |
| --- | ---|
| `/adlist` | 查看所有广告关键词 |
| `/addad 关键词` | 添加新关键词 |
| `/delad 关键词` | 删除关键词 |
| `/adblock on` | 启用过滤 |
| `/adblock off` | 禁用过滤 |
| `/adblock ban` | 切换为"删除+踢人"模式 |
| `/adblock del` | 切换为"仅删除"模式 |

---

## 📁 项目结构

```
digi-decoder-bot/
├── src/
│   ├── index.ts             # Worker 入口（webhook / queue / scheduled）
│   ├── dispatch.ts          # 更新分发（命令 / 消息 / 回调 / 事件）
│   ├── ctx.ts               # 统一回复上下文（send/edit 双模式）
│   ├── middleware.ts        # 黑名单 + 速率限制
│   ├── config.ts            # KV 缓存配置（默认值 + 覆盖合并）
│   ├── db.ts                # D1 数据访问层
│   ├── telegram.ts          # Bot API 客户端（fetch 实现）
│   ├── telegram-types.ts    # Telegram 类型定义
│   ├── env.ts               # 绑定与 Env 类型
│   ├── queue.ts             # 队列消费者（广播 / 通知）
│   ├── handlers/            # 功能模块
│   │   ├── admin.ts         # 管理功能
│   │   ├── adminCommands.ts # 命令注册
│   │   ├── adblock.ts       # 广告过滤
│   │   ├── aiChat.ts        # AI 问答
│   │   ├── callbacks.ts     # 回调处理
│   │   ├── checkin.ts       # 签到
│   │   ├── commands.ts      # 命令定义
│   │   ├── faq.ts           # FAQ 自动回复
│   │   ├── menu.ts          # 菜单
│   │   ├── points.ts        # 积分系统
│   │   ├── tools.ts         # 工具箱
│   │   ├── tutorials.ts     # 教程中心
│   │   └── welcome.ts       # 欢迎语
│   └── utils/               # 工具函数
│       ├── network.ts       # 网络工具
│       ├── text.ts          # 文本工具
│       └── tokens.ts        # Token 工具
├── migrations/
│   └── 0001_init.sql        # 数据库初始化脚本
├── scripts/
│   └── set-webhook.mjs      # Webhook 设置脚本
├── wrangler.jsonc           # Cloudflare 配置
├── package.json             # 依赖配置
├── tsconfig.json            # TypeScript 配置
├── .dev.vars.example        # 环境变量示例
├── .gitignore               # Git 忽略文件
└── README.md                # 项目文档
```

---

## 🔧 常用运维

```bash
# 实时查看日志
npx wrangler tail

# 重新部署（改代码后）
npm run deploy

# 重新绑定 webhook
node scripts/set-webhook.mjs

# 本地开发
npm run dev

# 类型检查
npm run types
```

---

## ❓ 常见问题

### Bot 没反应？
1. 检查 webhook 是否绑定：`node scripts/set-webhook.mjs`
2. 查看实时日志：`npx wrangler tail`
3. 确认 Bot Token 是否正确

### 数据库报错？
- 确保执行了 `npm run db:migrate -- --remote`
- 检查 `wrangler.jsonc` 中的 `database_id` 是否正确

### 广告过滤不生效？
- Bot 必须是**群管理员**
- 检查是否启用：`/adblock on`
- 查看关键词列表：`/adlist`

### AI 报错？
- Workers AI 有免费额度，超限后会报错
- 可以在配置中禁用 AI：`/setjson {"ai":{"enabled":false}}`

---

## 📄 免责声明

本项目仅用于学习与演示，请遵守相关法律法规，不要用于非法用途。

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

## 📜 License

MIT License