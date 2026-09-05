import type { MessageBatch } from '@cloudflare/workers-types';
import type { Env, QueueJob } from './env';
import { TgBot } from './telegram';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 队列消费者：处理耗时的后台任务（群发广播、私聊推送、工具任务等）。
 * 通过 Queues 解耦，避免 webhook 请求超时。
 */
export async function handleQueueBatch(batch: MessageBatch<QueueJob>, env: Env): Promise<void> {
  for (const jobMsg of batch.messages) {
    try {
      await processJob(jobMsg.body, env);
    } catch (e) {
      console.error('queue job failed:', JSON.stringify(jobMsg.body), e);
    }
  }
}

async function processJob(job: QueueJob, env: Env): Promise<void> {
  const bot = new TgBot(env.TELEGRAM_BOT_TOKEN);
  const parseMode = (job as { parseMode?: string }).parseMode;

  switch (job.type) {
    case 'notify': {
      await bot.sendMessage(job.chatId, job.text, {
        parse_mode: (parseMode as 'HTML' | undefined) ?? 'HTML',
        disable_web_page_preview: true,
      });
      break;
    }

    case 'broadcast': {
      const total = job.ids.length;
      let okCount = 0;
      for (let i = 0; i < total; i++) {
        try {
          await bot.sendMessage(job.ids[i], job.text, {
            parse_mode: (parseMode as 'HTML' | undefined) ?? 'HTML',
            disable_web_page_preview: true,
          });
          okCount++;
        } catch {
          // 忽略被屏蔽 / 无效用户
        }
        // 每 20 条稍作休眠，规避 Telegram 限流
        if (i % 20 === 19) await sleep(200);
      }
      await env.KV.put(`bcast:${job.id}`, `${okCount}/${total}`, { expirationTtl: 86400 });
      break;
    }

    default:
      console.warn('unknown queue job type', job);
  }
}