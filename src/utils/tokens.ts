// 兑换码 / 邀请码生成
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符

export function randomCode(len = 8): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}

/** 批次生成兑换码（带互斥校验） */
export function genOrderCodes(count: number, len = 8): string[] {
  const codes: string[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (codes.length < count && guard < 1000) {
    guard++;
    const c = randomCode(len);
    if (!seen.has(c)) {
      seen.add(c);
      codes.push(c);
    }
  }
  return codes;
}