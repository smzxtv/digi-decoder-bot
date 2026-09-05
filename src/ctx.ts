import type { Env, ParseMode } from './env';
import { TgBot } from './telegram';
import type {
  TgCallbackQuery,
  TgChat,
  TgInlineKeyboardMarkup,
  TgMessage,
  TgUpdate,
  TgUser,
} from './telegram-types';
import { isStaticAdmin } from './env';

export interface ReplyOpts {
  parseMode?: ParseMode;
  inlineKeyboard?: TgInlineKeyboardMarkup['inline_keyboard'];
  disableWebPagePreview?: boolean;
  replyTo?: boolean;
}

/**
 * 统一请求上下文：封装 send/edit 双模式回复。
 * - 回调场景 reply() 走 editMessageText（不传键盘则保留原键盘）
 * - 消息场景 reply() 走 sendMessage
 */
export interface Ctx {
  env: Env;
  bot: TgBot;
  update: TgUpdate;
  from: TgUser | null;
  chat: TgChat | null;
  message: TgMessage | null;
  query: TgCallbackQuery | null;
  text: string | null;
  /** 参数（首个空格之后的内容） */
  arg: string;
  isPrivate: boolean;
  isGroup: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  reply(text: string, opts?: ReplyOpts): Promise<void>;
  sendTo(chatId: number | string, text: string, opts?: ReplyOpts): Promise<void>;
  answer(text?: string, alert?: boolean): Promise<void>;
  /** 回复并携带行内键盘 */
  keypad(text: string, lines: TgInlineKeyboardMarkup['inline_keyboard'], parseMode?: ParseMode): Promise<void>;
}

export function makeCtx(env: Env, update: TgUpdate): Ctx {
  const bot = new TgBot(env.TELEGRAM_BOT_TOKEN);

  const msg = update.message ?? null;
  const query: TgCallbackQuery | null = update.callback_query ?? null;
  const from: TgUser | null = msg?.from ?? query?.from ?? null;
  const chat: TgChat | null = msg?.chat ?? query?.message?.chat ?? null;

  const text = msg?.text ?? msg?.caption ?? null;
  const isPrivate = chat?.type === 'private';
  const isGroup = chat?.type === 'group' || chat?.type === 'supergroup';

  const userId = from?.id ?? 0;
  const isAdmin = isStaticAdmin(env, userId);
  const isOwner = !!env.DEFAULT_OWNER_ID && String(env.DEFAULT_OWNER_ID) === String(userId);

  // 参数：命令后的附加文本
  let arg = '';
  if (text && text.startsWith('/')) {
    const rest = text.slice(text.indexOf(' '));
    arg = rest.trimStart();
  }

  const reply = async (t: string, opts: ReplyOpts = {}) => {
    const kb: TgInlineKeyboardMarkup | undefined = opts.inlineKeyboard
      ? { inline_keyboard: opts.inlineKeyboard }
      : undefined;
    const common = {
      parse_mode: opts.parseMode ?? ('HTML' as const),
      disable_web_page_preview: opts.disableWebPagePreview ?? true,
    };

    if (query?.message && update.callback_query) {
      // 回调模式：编辑原消息；若原消息就是文本，直接 edit
      const target = query.message;
      await bot.editMessageText(target.chat.id, target.message_id, t, {
        ...common,
        ...(kb ? { reply_markup: kb } : {}),
      });
      return;
    }
    if (msg) {
      await bot.sendMessage(chat!.id, t, {
        ...common,
        reply_to_message_id: opts.replyTo ? msg.message_id : undefined,
        ...(kb ? { reply_markup: kb } : {}),
      });
      return;
    }
    // 群聊事件等无消息场景
    await bot.sendMessage(chat!.id, t, { ...common, ...(kb ? { reply_markup: kb } : {}) });
  };

  const sendTo = async (chatId: number | string, t: string, opts: ReplyOpts = {}) => {
    const kb = opts.inlineKeyboard ? { inline_keyboard: opts.inlineKeyboard } : undefined;
    await bot.sendMessage(chatId, t, {
      parse_mode: opts.parseMode ?? 'HTML',
      disable_web_page_preview: opts.disableWebPagePreview ?? true,
      ...(kb ? { reply_markup: kb } : {}),
    });
  };

  const answer = async (t?: string, alert = false) => {
    if (query) await bot.answerCallbackQuery(query.id, t, alert);
  };

  const keypad = async (t: string, lines: TgInlineKeyboardMarkup['inline_keyboard'], parseMode?: ParseMode) => {
    await reply(t, { inlineKeyboard: lines, parseMode });
  };

  return {
    env,
    bot,
    update,
    from,
    chat,
    message: msg,
    query,
    text,
    arg,
    isPrivate,
    isGroup,
    isAdmin,
    isOwner,
    reply,
    sendTo,
    answer,
    keypad,
  };
}