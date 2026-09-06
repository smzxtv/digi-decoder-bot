import type { Env } from './env';

export interface BotConfig {
  brand: { name: string; pointsName: string; greeting: string; };
  checkin: { enabled: boolean; rewardPoints: number; streakBonuses: { days: number; points: number; }[]; };
  invite: { invitedReward: number; inviterReward: number; };
  top: { limit: number; };
  ai: { enabled: boolean; model: string; maxTokens: number; promptSystem: string; rateLimitPerMin: number; };
  tools: { enabled: string[]; moreTools: { label: string; url: string; }[]; };
  tutorials: { channelUrl: string; categories: string[]; };
  lucky: { enabled: boolean; prize: string; winners: number; drawDay: number; note: string; announceChatId: string; };
  limits: { maxTextLen: number; };
}

export const DEFAULT_CONFIG: BotConfig = {
  brand: { name: '数码解码工具站', pointsName: '解码点', greeting: '欢迎来到数码解码工具站' },
  checkin: { enabled: true, rewardPoints: 8, streakBonuses: [{ days: 7, points: 30 }, { days: 14, points: 60 }, { days: 30, points: 150 }] },
  invite: { invitedReward: 20, inviterReward: 35 },
  top: { limit: 10 },
  ai: {
    enabled: true,
    model: '@cf/meta/llama-3.2-3b-instruct',
    maxTokens: 512,
    promptSystem: '你是"数码解码工具站" Telegram 机器人的 AI 助手，支持四种模式：1) AI问答：回答科技、数码、网络等通用问题；2) 代码助手：帮助编写、解释、调试代码；3) 文案助手：帮助撰写、润色文案；4) 文本处理：翻译、总结、改写文本。回答准确简洁，使用简体中文。你无法执行命令或查询实时数据，如果用户询问签到、积分等机器人功能，请引导使用 /checkin、/me、/tools 等命令。',
    rateLimitPerMin: 8,
  },
  tools: {
    enabled: ['base64', 'json', 'dns', 'ping', 'ip', 'url'],
    moreTools: [
      { label: '🖼 图片压缩', url: 'https://squoosh.app' },
      { label: '🛠 更多在线工具', url: 'https://it-tools.tech' },
    ],
  },
  tutorials: {
    channelUrl: 'https://www.youtube.com/@DECODING-w7d',
    categories: ['AI', 'VPS', 'Cloudflare', 'Docker', 'Linux', '网络技术', '软件教程'],
  },
  lucky: { enabled: true, prize: '充电器', winners: 2, drawDay: 1, note: '当月签到满 5 天即自动获得抽奖资格。', announceChatId: '' },
  limits: { maxTextLen: 2000 },
};

const CONFIG_KV_KEY = 'bot:config:v1';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, overlay: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay === undefined ? base : (overlay as T);
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(overlay)) out[key] = deepMerge(out[key], (overlay as Record<string, unknown>)[key]);
  return out as T;
}

export async function getConfig(env: Env): Promise<BotConfig> {
  try {
    const raw = await env.KV.get(CONFIG_KV_KEY);
    if (raw) { try { return deepMerge(DEFAULT_CONFIG, JSON.parse(raw)); } catch {} }
  } catch {}
  return DEFAULT_CONFIG;
}

export async function setConfigOverlay(env: Env, overlay: Record<string, unknown>): Promise<void> {
  await env.KV.put(CONFIG_KV_KEY, JSON.stringify(overlay));
}

export async function resetConfig(env: Env): Promise<void> {
  await env.KV.delete(CONFIG_KV_KEY);
}
