import type { Env } from './env';

/**
 * 机器人运行时配置。
 * 默认值内置在代码中，可整体被管理员覆盖：
 *   1. 读取 KV 中的覆盖配置（覆盖配置以 JSON 形式整体存储，与默认值深合并）
 *   2. 管理员通过 /setjson 修改，/reload 重新加载，/cfg 查看
 */

export interface FaqRule {
  id: string;
  keywords: string[];
  mode: 'exact' | 'includes' | 'startsWith';
  reply: string;
}

export interface BotConfig {
  brand: {
    name: string;
    pointsName: string;
    greeting: string;
  };
  welcome: {
    enabled: boolean;
    text: string; // 占位符: {name} {chat} {id}
    deleteSystemMessages: boolean;
  };
  faq: FaqRule[];
  checkin: {
    enabled: boolean;
    rewardPoints: number;
    // 连续签到里程碑额外奖励（达成对应天数当天一次性发放）
    streakBonuses: { days: number; points: number }[];
  };
  invite: {
    invitedReward: number; // 被邀请人获得
    inviterReward: number; // 邀请人获得
  };
  top: {
    limit: number; // 排行榜展示条数
  };
  ai: {
    enabled: boolean;
    model: string;
    maxTokens: number;
    promptSystem: string;
    rateLimitPerMin: number;
  };
  tools: {
    enabled: string[]; // 可用工具 id 列表
  };
  limits: {
    maxTextLen: number; // FAQ/AI 参与的最长文本
  };
  adblock: {
    enabled: boolean;
    keywords: string[]; // 广告关键词列表
    action: 'delete' | 'delete_and_ban'; // 命中后的处理方式
    adminBypass: boolean; // 管理员是否豁免检测
  };
}

export const DEFAULT_CONFIG: BotConfig = {
  brand: {
    name: '数码解码工具站',
    pointsName: '解码点',
    greeting: '欢迎来到数码解码工具站',
  },
  welcome: {
    enabled: true,
    text:
      '🎉 欢迎 {name} 加入 {chat}！\n\n' +
      '🛠 本站提供 IP 查询 / DNS 解析 / Ping 检测 / Base64 / JSON 解码等实用工具，\n' +
      '并支持将解码点兑换为工具时长与高级服务次数。\n\n' +
      '💰 每日签到、邀请好友即可获得解码点。\n' +
      '📌 回复 /help 或点击下方菜单开始使用。',
    deleteSystemMessages: true,
  },
  faq: [
    {
      id: 'faq_how_start',
      keywords: ['怎么开始', '如何使用', '工具在哪', '工具怎么用', '新手'],
      mode: 'includes',
      reply:
        '📌 使用指南：\n' +
        '1️⃣ 发送 /tools 打开工具箱（IP/DNS/Ping/Base64/JSON）\n' +
        '2️⃣ 发送 /checkin 每日签到领解码点\n' +
        '3️⃣ 发送 /me 查看解码点余额\n' +
        '4️⃣ 高级服务与时长兑换请在群内查看兑换说明',
    },
    {
      id: 'faq_points',
      keywords: ['解码点', '积分怎么来', '积分有什么用', '如何赚积分', '点怎么获得'],
      mode: 'includes',
      reply:
        '💎 解码点是本站服务货币：\n' +
        '・每日签到：+8 解码点\n' +
        '・连续签到：第 7/14/30 天有里程碑奖励\n' +
        '・邀请好友：双方各得奖励\n\n' +
        '解码点可用于兑换 工具使用时长 / 高级服务次数 / 会员特权，发送 /me 查看余额。',
    },
    {
      id: 'faq_checkin',
      keywords: ['签到', '打卡', '每日签到'],
      mode: 'includes',
      reply:
        '📝 发送 /checkin 即可每日签到！\n' +
        '・每日基础 +8 解码点\n' +
        '・连续 7 天 +30、14 天 +60、30 天 +150（当天额外发放）\n' +
        '坚持越久奖励越多哦！',
    },
    {
      id: 'faq_invite',
      keywords: ['邀请', '拉人', '邀请好友', '裂变'],
      mode: 'includes',
      reply:
        '🎁 发送 /invite 获取你的专属邀请链接。\n' +
        '好友通过链接注册：好友 +20 解码点，你 +35 解码点。\n' +
        '邀请越多，解锁的工具时长越多！',
    },
    {
      id: 'faq_tools',
      keywords: ['ip', 'dns', 'ping', 'base64', 'json', '解码工具', '工具'],
      mode: 'includes',
      reply:
        '🧰 工具箱支持：\n' +
        '・IP 归属查询 → /ip\n' +
        '・DNS 解析 → /dns 域名 AAAA\n' +
        '・Ping 延迟检测 → /ping 域名\n' +
        '・Base64 编解码 → /b64 encode 文本\n' +
        '・JSON 格式化 → /json {"a":1}\n\n' +
        '直接发送 /tools 打开面板更方便！',
    },
    {
      id: 'faq_redeem',
      keywords: ['兑换', '兑换码', '卡密', '充值'],
      mode: 'includes',
      reply:
        '🎟 在管理员处购买/领取兑换码后，私聊发送：\n' +
        '<code>/redeem 兑换码</code>\n' +
        '即可兑换对应面值的解码点，用于解锁工具时长与服务。',
    },
    {
      id: 'faq_hello',
      keywords: ['你好', '您好', 'hi', 'hello', '在吗'],
      mode: 'exact',
      reply: '你好呀！这里是数码解码工具站 🤖 发送 /help 查看全部功能。',
    },
  ],
  checkin: {
    enabled: true,
    rewardPoints: 8,
    streakBonuses: [
      { days: 7, points: 30 },
      { days: 14, points: 60 },
      { days: 30, points: 150 },
    ],
  },
  invite: {
    invitedReward: 20,
    inviterReward: 35,
  },
  top: {
    limit: 10,
  },
  ai: {
    enabled: true,
    model: '@cf/meta/llama-3.1-8b-instruct',
    maxTokens: 512,
    promptSystem:
      '你是"数码解码工具站"的智能助手，熟悉 IP/DNS/Ping 检测、Base64/JSON 解码等网络工具的使用方法，也能解答解码点获取与兑换规则。回答使用简体中文，简洁专业，涉及具体命令时给出可用命令。',
    rateLimitPerMin: 8,
  },
  tools: {
    enabled: ['base64', 'json', 'dns', 'ping', 'ip', 'deco'],
  },
  limits: {
    maxTextLen: 2000,
  },
  adblock: {
    enabled: true,
    keywords: [
      '加群', '兼职', '刷单', '日赚', '月赚', '赚钱',
      '免费领', '免费领', '扫码', '加我', '薇信', 'vx', 'v信',
      '代购', '代理', '招商', '加盟', '投资', '理财',
      '彩票', '博彩', '赌', '棋牌', '稳赚', '包赚',
      '贷款', '借款', '信用卡套现', '代开', '发票',
      '加QQ', '加微信', '加V', '加薇', '加扣',
      '招聘', '诚聘', '高薪', '急聘', '直聘',
    ],
    action: 'delete',
    adminBypass: true,
  },
};

const CONFIG_KV_KEY = 'bot:config:v1';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 深合并（默认 <- 覆盖配置） */
function deepMerge<T>(base: T, overlay: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(overlay)) {
    return overlay === undefined ? base : (overlay as T);
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(overlay)) {
    out[key] = deepMerge(out[key], (overlay as Record<string, unknown>)[key]);
  }
  return out as T;
}

/** 获取生效配置（KV 缓存读取） */
export async function getConfig(env: Env): Promise<BotConfig> {
  try {
    const raw = await env.KV.get(CONFIG_KV_KEY);
    if (raw) {
      try {
        const overlay = JSON.parse(raw);
        return deepMerge(DEFAULT_CONFIG, overlay);
      } catch {
        // 配置损坏则回退默认
      }
    }
  } catch {
    // KV 不可用时回退默认
  }
  return DEFAULT_CONFIG;
}

/** 覆盖配置（管理员用 /setjson 编辑整体配置） */
export async function setConfigOverlay(env: Env, overlay: Record<string, unknown>): Promise<void> {
  await env.KV.put(CONFIG_KV_KEY, JSON.stringify(overlay));
}

/** 重置为默认配置 */
export async function resetConfig(env: Env): Promise<void> {
  await env.KV.delete(CONFIG_KV_KEY);
}