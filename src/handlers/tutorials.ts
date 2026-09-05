import type { Ctx } from '../ctx';
import { addTutorial, getTutorial, listTutorialCategories, listTutorials } from '../db';
import { btn } from '../telegram';
import { esc, trunc } from '../utils/text';

/** 教程中心首页 */
export async function tutorialsHome(ctx: Ctx): Promise<void> {
  const cats = await listTutorialCategories(ctx.env.DB);
  const lines = cats.map((c) => [btn(`📂 ${c}`, `tu:cat:${c}`)]);
  if (cats.length === 0) {
    await ctx.reply('📚 教程中心\n\n暂无教程，板块建设中…', {
      inlineKeyboard: [[btn('⬅ 返回主菜单', 'menu:main')]],
    });
    return;
  }
  await ctx.reply('📚 <b>教程中心</b>\n选择分类浏览：', {
    inlineKeyboard: [...lines, [btn('⬅ 返回主菜单', 'menu:main')]],
  });
}

/** 分类下的教程列表 */
export async function tutorialsByCategory(ctx: Ctx, category: string): Promise<void> {
  const list = await listTutorials(ctx.env.DB, category);
  if (list.length === 0) {
    await ctx.reply('该分类暂无教程。', { inlineKeyboard: [[btn('⬅ 返回分类', 'tu:show')]] });
    return;
  }
  const lines = list.map((t) => [btn(`📄 ${t.title}（${t.view_count}）`, `tu:it:${t.id}`)]);
  await ctx.reply(`📂 <b>${esc(category)}</b>（${list.length} 篇）`, {
    inlineKeyboard: [...lines, [btn('⬅ 返回分类', 'tu:show')]],
  });
}

/** 教程详情 */
export async function tutorialContent(ctx: Ctx, id: number): Promise<void> {
  const tut = await getTutorial(ctx.env.DB, id);
  if (!tut) {
    await ctx.reply('教程不存在。', { inlineKeyboard: [[btn('⬅ 返回分类', 'tu:show')]] });
    return;
  }
  const body = trunc(tut.content, 3800);
  const text = [
    `📄 <b>${esc(tut.title)}</b>`,
    `📂 ${esc(tut.category)}　👀 ${tut.view_count} 次浏览`,
    tut.summary ? `\n💡 ${esc(tut.summary)}\n` : '',
    ``,
    body,
  ].join('\n');
  await ctx.reply(text, { inlineKeyboard: [[btn('⬅ 返回分类', 'tu:show')]] });
}

/** 管理员添加教程：/tutorial add <标题>|<分类>|<摘要>|<内容> */
export async function adminAddTutorial(ctx: Ctx, arg: string): Promise<void> {
  const input = arg.trim();
  if (!input) {
    await ctx.reply('用法：/tutorial add 标题|分类|摘要|正文');
    return;
  }
  const parts = input.split('|').map((s) => s.trim());
  const title = parts[0];
  const category = parts[1] || '其他';
  const summary = parts[2] || '';
  const content = parts.slice(3).join('|');
  if (!title || !content) {
    await ctx.reply('至少需要：标题|正文');
    return;
  }
  await addTutorial(ctx.env.DB, { title, category, summary, content, authorId: ctx.from!.id });
  await ctx.reply(`✅ 教程「${esc(title)}」已发布到分类「${esc(category)}」。`);
}