#!/usr/bin/env node
/**
 * 设置 / 删除 Telegram webhook
 * 用法：
 *   node scripts/set-webhook.mjs                    # 设置（从 .dev.vars 或环境变量读 WEBHOOK_URL / TELEGRAM_BOT_TOKEN）
 *   node scripts/set-webhook.mjs --delete           # 删除 webhook
 * 需要：WRANGLER_SECRET 或 已配置 .dev.vars
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDevVars() {
  const vars = {};
  const p = resolve(process.cwd(), '.dev.vars');
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx > 0) {
        vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }
  }
  return vars;
}

const devVars = loadDevVars();
const token = process.env.TELEGRAM_BOT_TOKEN || devVars.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL || devVars.WEBHOOK_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || devVars.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  console.error('❌ 缺少 TELEGRAM_BOT_TOKEN（请在 .dev.vars 或环境变量中配置）');
  process.exit(1);
}

const del = process.argv.includes('--delete');
const api = `https://api.telegram.org/bot${token}`;

async function main() {
  if (del) {
    const r = await fetch(`${api}/deleteWebhook`);
    const j = await r.json();
    console.log(j.ok ? '✅ 已删除 webhook' : `❌ 删除失败: ${JSON.stringify(j)}`);
    return;
  }
  if (!webhookUrl) {
    console.error('❌ 缺少 WEBHOOK_URL。部署后可运行 `wrangler deploy`，然后把 https://xxxx.workers.dev/webhook/bot 填到 .dev.vars');
    process.exit(1);
  }
  const body = { url: webhookUrl };
  if (secret) body.secret_token = secret;
  const r = await fetch(`${api}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.ok) {
    console.log(`✅ webhook 已指向 ${webhookUrl}`);
    if (secret) console.log(`🔒 已设置 secret_token`);
    const me = await (await fetch(`${api}/getMe`)).json();
    console.log(`🤖 Bot: @${me.result?.username || 'unknown'}`);
  } else {
    console.error(`❌ 设置失败: ${JSON.stringify(j)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});