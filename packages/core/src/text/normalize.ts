/**
 * Chuẩn hóa tiếng Việt cho khớp luật:
 *  - hạ chữ thường, gom khoảng trắng
 *  - mở rộng teencode phổ biến (ko -> không, dc -> được, ...)
 *  - bỏ dấu (NFD) để một luật khớp cả "muốn chết" và "muon chet"
 *
 * Quan trọng: đây KHÔNG phải xử lý ngôn ngữ đầy đủ; mục tiêu là recall cao
 * cho lớp luật, độ chính xác được bù bởi lớp phân loại ngữ nghĩa.
 */

const TEENCODE: Record<string, string> = {
  ko: 'không',
  k: 'không',
  kh: 'không',
  hok: 'không',
  hong: 'không',
  hum: 'không',
  khum: 'không',
  kg: 'không',
  kb: 'không biết',
  kbh: 'không bao giờ',
  dc: 'được',
  đc: 'được',
  đk: 'được',
  mún: 'muốn',
  mun: 'muốn',
  mik: 'mình',
  mk: 'mình',
  mjk: 'mình',
  t: 'tôi',
  tui: 'tôi',
  tao: 'tôi',
  e: 'em',
  a: 'anh',
  c: 'chị',
  ng: 'người',
  ngta: 'người ta',
  mn: 'mọi người',
  j: 'gì',
  z: 'vậy',
  zậy: 'vậy',
  v: 'vậy',
  r: 'rồi',
  rùi: 'rồi',
  roi: 'rồi',
  wa: 'quá',
  qá: 'quá',
  bt: 'bình thường',
  bth: 'bình thường',
  cx: 'cũng',
  cg: 'cũng',
  vs: 'với',
  vz: 'với',
  ny: 'người yêu',
  nch: 'nói chuyện',
  hnay: 'hôm nay',
  hqua: 'hôm qua',
  bh: 'bây giờ',
  bjo: 'bây giờ',
  lm: 'làm',
  lun: 'luôn',
  ns: 'nói',
  nz: 'nói',
  ntn: 'như thế nào',
  đag: 'đang',
  dag: 'đang',
  bik: 'biết',
  bít: 'biết',
  ch: 'chưa',
  chx: 'chưa',
  sog: 'sống',
  sốg: 'sống',
  chớt: 'chết',
  chít: 'chết',
  chet: 'chết',
  ttu: 'tự tử',
  tt: 'tự tử',
  sh: 'self harm',
  sefl: 'self',
  suicide: 'tự tử',
  die: 'chết',
  kys: 'tự tử',
  unalive: 'tự tử',
};

export function stripDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function expandTeencode(input: string): string {
  return input
    .split(/(\s+)/)
    .map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      const core = tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      const key = core.toLowerCase();
      const rep = TEENCODE[key];
      if (!rep) return tok;
      return tok.replace(core, rep);
    })
    .join('');
}

export interface NormalizedText {
  /** Văn bản gốc. */
  raw: string;
  /** Chữ thường, đã mở rộng teencode, còn dấu. */
  vi: string;
  /** Như `vi` nhưng bỏ dấu và bỏ ký tự đặc biệt — dùng để khớp luật. */
  ascii: string;
  tokens: string[];
}

export function normalizeVietnamese(input: string): NormalizedText {
  const lowered = input.toLowerCase().replace(/\s+/g, ' ').trim();
  const expanded = expandTeencode(lowered);
  const ascii = stripDiacritics(expanded)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    raw: input,
    vi: expanded,
    ascii,
    tokens: ascii ? ascii.split(' ') : [],
  };
}
