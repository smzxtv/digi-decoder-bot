import type { MessageBatch } from '@cloudflare/workers-types';
import type { Env, QueueJob } from './env';
import type { TgUpdate } from './telegram-types';
import { handleUpdate } from './dispatch';
import { handleQueueBatch } from './queue';
import { appendLog } from './handlers/admin';

// 简易内存缓存：广告配置（KV 读取后缓存，避免每次请求都读 KV）
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 注入广告配置到 env
    
    // 健康检查
    if (url.pathname === '/' && request.method === 'GET') {
      return Response.json({ ok: true, service: 'digi-decoder-bot', time: new Date().toISOString() });
    }
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ ok: true });
    }

    // Telegram webhook
    if (url.pathname === '/webhook/bot' && request.method === 'POST') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response('unauthorized', { status: 401 });
      }
      try {
        const update = (await request.json()) as TgUpdate;
        await handleUpdate(env, update);
        return new Response('ok');
      } catch (e) {
        // 记录错误到数据库，避免 500 导致 Telegram 无限重试
        const errMsg = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error ? e.stack : '';
        try {
          await env.DB.prepare(
            "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
          ).bind(`error:${Date.now()}`, `${errMsg}\n${stack}`.slice(0, 2000)).run();
        } catch {
          /* 忽略记录失败 */
        }
        // 返回 200 避免 Telegram 重试，错误信息已记录
        return new Response('ok');
      }
    }

    return new Response('not found', { status: 404 });
  },

  async queue(batch: MessageBatch<QueueJob>, env: Env): Promise<void> {
    await handleQueueBatch(batch, env);
  },

  async scheduled(_event: unknown, env: Env): Promise<void> {
    // 定期把用户数据备份到 R2（每月 1 日 05:00 Asia/Shanghai 触发）
    // 注意：R2 是可选绑定，未配置时跳过备份
    if (!env.R2_BUCKET) return;
    try {
      const res = await env.DB.prepare('SELECT * FROM users ORDER BY id').all<Record<string, unknown>>();
      const date = new Date().toISOString().slice(0, 10);
      await env.R2_BUCKET.put(
        `backups/users-${date}.json`,
        JSON.stringify(res.results ?? [], null, 2)
      );
      await appendLog(env, `🗄️ 定时备份完成（${date}，${(res.results ?? []).length} 条）`);
    } catch (e) {
      console.error('scheduled backup failed', e);
    }
  },
};