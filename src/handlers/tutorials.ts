import type { Ctx } from '../ctx';
import { getConfig } from '../config';
import { esc } from '../utils/text';

/**
 * 教程中心：分类按钮直接跳转 YouTube 频道
 * 频道地址与分类列表在 src/config.ts 的 tutorials 配置中修改
 */
export async function tutorialsHome(ctx: Ctx): Promise<void> {
  const cfg = await getConfig(ctx.env);
  const url = cfg.tutorials.channelUrl;

  const lines = [
    `📚 <b>教程中心</b>`,
    ``,
    `🎬 全部视频教程已整理在 YouTube 频道：`,
    `<code>${esc(url)}</code>`,
    ``,
    `点击下方分类直达 👇`,
  ].join('\n');

  // 每个分类一个跳转按钮（链接到频道主页；想细分可改成搜索链接：
  // `${url}/search?q=${encodeURIComponent(cat)}`）
  const catButtons = cfg.tutorials.categories.map((c) => ({
    text: `▶️ ${c}`,
    url,
  }));
  const rows: { text: string; url: string }[][] = [];
  for (let i = 0; i < catButtons.length; i += 2) {
    rows.push(catButtons.slice(i, i + 2));
  }

  await ctx.reply(lines, {
    inlineKeyboard: [
      ...rows,
      [{ text: '🏠 打开频道主页', url }],
    ],
  });
}