// Telegram Bot API 类型定义（按需精简版）
export interface TgUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TgChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  title?: string;
}

export interface TgMessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TgUser;
}

export interface TgMessage {
  message_id: number;
  from?: TgUser;
  sender_chat?: TgChat;
  date: number;
  chat: TgChat;
  text?: string;
  caption?: string;
  entities?: TgMessageEntity[];
  reply_to_message?: TgMessage;
  new_chat_members?: TgUser[];
  left_chat_member?: TgUser;
  photo?: unknown[];
  document?: unknown;
  video?: unknown;
  voice?: unknown;
  audio?: unknown;
}

export interface TgCallbackQuery {
  id: string;
  from: TgUser;
  message?: TgMessage;
  inline_message_id?: string;
  data?: string;
}

export interface TgChatMember {
  status: string; // creator | administrator | member | restricted | left | kicked
  user: TgUser;
  until_date?: number;
}

export interface TgChatMemberUpdated {
  chat: TgChat;
  from: TgUser;
  date: number;
  old_chat_member: TgChatMember;
  new_chat_member: TgChatMember;
  invite_link?: unknown;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  edited_message?: TgMessage;
  channel_post?: TgMessage;
  callback_query?: TgCallbackQuery;
  my_chat_member?: TgChatMemberUpdated;
  chat_member?: TgChatMemberUpdated;
  inline_query?: unknown;
}

export interface TgInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: unknown;
  login_url?: unknown;
}

export interface TgInlineKeyboardMarkup {
  inline_keyboard: TgInlineKeyboardButton[][];
}

export interface TgReplyKeyboardMarkup {
  keyboard: { text: string; callback_data?: string }[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export interface TgSendMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
  reply_markup?: TgInlineKeyboardMarkup;
}

export interface TgEditMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  reply_markup?: TgInlineKeyboardMarkup;
}