import type {
  TgInlineKeyboardButton,
  TgInlineKeyboardMarkup,
  TgMessage,
  TgSendMessageOptions,
  TgEditMessageOptions,
} from './telegram-types';

const API_BASE = 'https://api.telegram.org/bot';

/**
 * 轻量 Telegram Bot API 客户端，全部基于 fetch，无外部依赖。
 */
export class TgBot {
  private token: string;
  private base: string;

  constructor(token: string) {
    this.token = token;
    this.base = API_BASE + token;
  }

  /** 通用请求 */
  async call<T = unknown>(method: string, body: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(`${this.base}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; result: T; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram API ${method} failed: ${data.description ?? res.status}`);
    }
    return data.result;
  }

  /** 安全版：失败不抛异常，返回 null */
  async callSafe<T = unknown>(method: string, body: Record<string, unknown> = {}): Promise<T | null> {
    try {
      return await this.call<T>(method, body);
    } catch {
      return null;
    }
  }

  getMe(): Promise<{ id: number; username: string; first_name: string }> {
    return this.call('getMe');
  }

  async setWebhook(url: string, secret?: string): Promise<boolean> {
    const body: Record<string, unknown> = { url };
    if (secret) body.secret_token = secret;
    const r = await this.call<boolean>('setWebhook', body);
    return r;
  }

  sendMessage(chatId: number | string, text: string, opts: TgSendMessageOptions = {}) {
    return this.call<TgMessage>('sendMessage', { chat_id: chatId, text, ...opts });
  }

  editMessageText(
    chatId: number | string,
    messageId: number,
    text: string,
    opts: TgEditMessageOptions = {}
  ) {
    return this.call<TgMessage | boolean>('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...opts,
    });
  }

  answerCallbackQuery(queryId: string, text?: string, showAlert = false) {
    return this.callSafe<boolean>('answerCallbackQuery', {
      callback_query_id: queryId,
      ...(text ? { text } : {}),
      ...(showAlert ? { show_alert: true } : {}),
    });
  }

  deleteMessage(chatId: number | string, messageId: number) {
    return this.callSafe<boolean>('deleteMessage', { chat_id: chatId, message_id: messageId });
  }

  sendChatAction(chatId: number | string, action: string) {
    return this.callSafe<boolean>('sendChatAction', { chat_id: chatId, action });
  }

  getChat(chatId: number | string) {
    return this.callSafe<{ id: number; type: string; title?: string; username?: string }>('getChat', {
      chat_id: chatId,
    });
  }

  getChatMember(chatId: number | string, userId: number) {
    return this.callSafe<{ status: string; user: TgMessage['from'] }>('getChatMember', {
      chat_id: chatId,
      user_id: userId,
    });
  }
}

/** 便捷构造一维按钮行 */
export function btn(text: string, callback_data: string, url?: string): TgInlineKeyboardButton {
  return url ? { text, url } : { text, callback_data };
}

/** 便捷构造行组 */
export function kb(rows: TgInlineKeyboardButton[][]): TgInlineKeyboardMarkup {
  return { inline_keyboard: rows };
}