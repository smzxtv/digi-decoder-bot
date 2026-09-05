// 工具箱所需网络 / 编解码工具
// 全部基于 Cloudflare Workers 自带能力，无需第三方依赖。

// ---------------- Base64 ----------------

export function b64Encode(text: string): string {
  return btoa(new TextEncoder().encode(text).reduce((s, b) => s + String.fromCharCode(b), ''));
}

export function b64Decode(text: string): string {
  try {
    const bin = atob(text.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error('Base64 解码失败：内容不是合法的 Base64 或包含非 UTF-8 数据');
  }
}

// ---------------- JSON ----------------

export function jsonBeautify(text: string): string {
  const obj = JSON.parse(text); // 抛错则交由上层提示
  return JSON.stringify(obj, null, 2);
}

export function jsonMinify(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

// ---------------- DNS（Cloudflare DoH，1.1.1.1） ----------------

export interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export async function dnsQuery(domain: string, type = 'A'): Promise<DnsAnswer[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, {
    headers: { accept: 'application/dns-json' },
  });
  if (!res.ok) throw new Error(`DNS 查询失败（HTTP ${res.status}）`);
  const data = (await res.json()) as { Status: number; Answer?: DnsAnswer[]; Comment?: string };
  if (data.Status !== 0) throw new Error(`DNS 返回异常状态码 ${data.Status}${data.Comment ? `（${data.Comment}）` : ''}`);
  if (!data.Answer || data.Answer.length === 0) throw new Error('未查询到记录');
  return data.Answer;
}

// ---------------- Ping（HTTP 延迟检测） ----------------

export interface PingResult {
  host: string;
  httpStatus: number | null;
  latencyMs: number;
  colo?: string;
}

export async function pingHost(raw: string): Promise<PingResult> {
  let host = raw.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  if (!host) throw new Error('请输入要检测的主机名');
  // 兜底：Cloudflare 能识别的公开目标无需本地 DNS
  const start = Date.now();
  try {
    const res = await fetch(`https://${host}/`, {
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    return {
      host,
      httpStatus: res.status,
      latencyMs: Date.now() - start,
      colo: res.headers.get('cf-ray') != null ? 'CF' : undefined,
    };
  } catch {
    return { host, httpStatus: null, latencyMs: Date.now() - start };
  }
}

// ---------------- IP 查询（借助 Cloudflare trace 接口） ----------------

export interface IpInfo {
  ip: string;
  loc: string | null;
  colo: string | null;
  asn: string | null;
  uag: string | null;
}

export async function queryIp(ip?: string): Promise<IpInfo> {
  const res = await fetch('https://1.0.0.1/cdn-cgi/trace');
  const text = await res.text();
  const map = new Map<string, string>();
  for (const line of text.split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) map.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return {
    ip: map.get('ip') ?? '未知',
    loc: map.get('loc') ?? null,
    colo: map.get('colo') ?? null,
    asn: map.get('asn') ?? null,
    uag: map.get('uag') ?? null,
  };
}