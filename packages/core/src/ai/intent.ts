import { normalizeVietnamese } from '../text/normalize.ts';
import type { Emotion, EmotionIntensity, Intent, IntentAnalysis, Topic } from '../types.ts';

/**
 * Phân loại ý định + cảm xúc bằng luật. Đây là FALLBACK khi không có LLM,
 * và cũng là "sanity check" cho kết quả LLM.
 */

const INTENT_PATTERNS: Array<{ intent: Intent; re: RegExp; w: number }> = [
  { intent: 'wanting_human', re: /\b(?:nguoi that|nguoi thuc|chuyen gia|tu van vien|tham van|bac si|nha tam ly|dat lich|(?:muon|can|cho minh|co the) (?:noi|noi chuyen|gap|tam su|nhan) (?:voi )?(?:ai do that|nguoi that|mot nguoi|ai do|chuyen gia|nguoi ho tro)|khong muon noi voi (?:may|bot|ai))\b/, w: 1 },
  { intent: 'asking_symptoms', re: /\b(?:co (?:phai|bi) (?:tram cam|lo au|roi loan|benh|adhd|luong cuc|tam than)|bi (?:tram cam|lo au|roi loan) (?:khong|ko|k|ha|a|phai khong)|(?:day|nay|the nay|vay) (?:la|co phai) (?:tram cam|lo au|roi loan|benh)|dau hieu (?:cua )?(?:tram cam|lo au|roi loan)|trieu chung)\b/, w: 1 },
  { intent: 'seeking_technique', re: /\b(?:lam sao|lam the nao|cach (?:nao|de|gi)|giup minh|huong dan|bai tap|ky thuat|tho|thien|meo|tip|de (?:binh tinh|ngu|tap trung|het lo|bot lo|bot buon|do stress|giam stress|doi pho)|nen lam gi|phai lam gi|co cach)\b/, w: 0.9 },
  { intent: 'asking_about_app', re: /\b(?:app nay|ung dung nay|ban la (?:ai|gi|nguoi|bot|ai that)|may la|nguoi that (?:a|ha|khong|ko)|bot (?:a|ha)|ai (?:tao ra|lam ra)|du lieu (?:cua minh|minh)|bao mat|xoa (?:tai khoan|du lieu)|luu (?:lai|tin nhan)|co (?:luu|ghi) (?:lai|khong))\b/, w: 1 },
  { intent: 'mood_checkin', re: /^(?:hom nay |hnay |gio |bay gio )?(?:minh |toi |em |tui )?(?:thay|cam thay|dang|kha|hoi|rat|cung|van) (?:on|binh thuong|tam|met|buon|lo|vui|ok|oke|te|chan|nhat|stress|ap luc|kho|khoe|do|hon)\b/, w: 0.8 },
  { intent: 'greeting', re: /^(?:hi|hello|helo|chao|xin chao|alo|ê|e|hey|yo|an oi|an a|co ai|co do khong|test|\.|\?|hihi|haha)\b/, w: 1 },
];

const EMOTION_PATTERNS: Array<{ emotion: Emotion; re: RegExp }> = [
  { emotion: 'anxious', re: /\b(?:lo|lo lang|lo au|so|hoang|hoi hop|bat an|cang thang|run|tim dap|panic|hoang loan|stress|ap luc|deadline|thi|kiem tra|phong van|ket qua)\b/ },
  { emotion: 'sad', re: /\b(?:buon|khoc|tui|tui than|dau long|that vong|hut hang|chia tay|mat|nho|co don|tam trang|nang long|xot|thuong)\b/ },
  { emotion: 'angry', re: /\b(?:tuc|gian|dien|buc|cau|ghet|kho chiu|bat cong|uc|uat|chui|dm|vcl|cay|bo tuc)\b/ },
  { emotion: 'tired', re: /\b(?:met|kiet suc|het pin|het suc|ru ru|khong con suc|met moi|dua|oai|chan|khong muon lam gi|luoi|burnout|qua tai)\b/ },
  { emotion: 'empty', re: /\b(?:trong rong|vo cam|tro|khong cam thay gi|te liet|nhat|vo nghia|khong (?:con )?(?:thay|cam)|mat cam giac|khong biet minh muon gi|mat phuong huong|lac loi)\b/ },
  { emotion: 'lonely', re: /\b(?:co don|mot minh|khong ai|chang ai|le loi|bi bo roi|khong co ban|xa nha|lac long|khong thuoc ve|khong ai hieu)\b/ },
  { emotion: 'overwhelmed', re: /\b(?:qua tai|ngop|khong kip|don dap|nhieu thu|qua nhieu|khong biet bat dau|roi|loan|bi doi|khong xoay|nga|chong|choang)\b/ },
  { emotion: 'hopeful', re: /\b(?:tot hon|do hon|nhe hon|hy vong|hi vong|vui|on hon|co dong luc|muon thu|muon co gang|cam on|biet on|tu tin)\b/ },
];

const TOPIC_PATTERNS: Array<{ topic: Topic; re: RegExp }> = [
  { topic: 'study', re: /\b(?:hoc|thi|diem|bai|truong|lop|giao vien|thay|co giao|dai hoc|de tai|do an|luan van|tot nghiep|hoc bong|on thi|thi lai|no mon|gpa|thpt|dh|ky thi)\b/ },
  { topic: 'work', re: /\b(?:lam|cong viec|viec|sep|dong nghiep|cong ty|luong|deadline|ot|tang ca|thuc tap|xin viec|phong van|nghi viec|bi duoi|kpi|thu viec|nghe)\b/ },
  { topic: 'family', re: /\b(?:bo|me|ba|ma|cha|gia dinh|nha|anh chi|em|ong ba|bo me|ba me|phu huynh|ho hang|ky vong|so sanh|con nha nguoi ta|ve que|ve nha)\b/ },
  { topic: 'relationship', re: /\b(?:nguoi yeu|ny|yeu|chia tay|crush|hen ho|tinh cam|tinh yeu|phan boi|cam sung|ghen|nho|ex|nguoi cu|to tinh|bi tu choi)\b/ },
  { topic: 'friends', re: /\b(?:ban|ban be|nhom ban|ban than|bff|bi bo roi|co lap|bat nat|noi xau|drama|hoi|nhom|bi loai)\b/ },
  { topic: 'money', re: /\b(?:tien|no|vay|hoc phi|chi tieu|thue nha|thu nhap|ngheo|kiem tien|tai chinh|tra no|khong du|dat do|lam them)\b/ },
  { topic: 'body_image', re: /\b(?:beo|gay|map|xau|ngoai hinh|can nang|an kieng|an uong|nhin an|co the|da|mun|chieu cao|body|khong dep|tu ti ve|so sanh)\b/ },
  { topic: 'sleep', re: /\b(?:ngu|mat ngu|thuc khuya|kho ngu|ac mong|gac|ngu khong|tinh giac|thuc den sang|dem)\b/ },
  { topic: 'social_media', re: /\b(?:facebook|fb|tiktok|instagram|insta|ig|mang xa hoi|mxh|luot|scroll|so sanh|like|follow|threads|story|bi chui tren|comment|cmt|bi body shaming|bi tan cong mang)\b/ },
  { topic: 'future', re: /\b(?:tuong lai|dinh huong|khong biet lam gi|ra truong|sau tot nghiep|su nghiep|con duong|chon nganh|lac loi|mat phuong huong|25 tuoi|30 tuoi|qua muon|tre|cham hon)\b/ },
];

const INTENSITY_HIGH = /\b(?:rat|qua|cuc|cuc ky|kinh khung|khung khiep|khong chiu noi|khong the|toi te|te hai|sap|muon khoc|khoc (?:suot|ca dem|ca ngay)|khong ngu duoc|khong an duoc|ca tuan|ca thang|lien tuc|moi ngay|khong ngung|vo cung|het suc|lam luon)\b/;
const INTENSITY_LOW = /\b(?:hoi|mot chut|chut|ti|nhe|tam|cung|kha|nhu binh thuong|thi thoang|doi khi|luc|co luc)\b/;

export function analyzeIntentByRules(text: string): IntentAnalysis {
  const { ascii } = normalizeVietnamese(text);

  let intent: Intent = 'unclear';
  let best = 0;
  for (const p of INTENT_PATTERNS) {
    if (p.re.test(ascii) && p.w > best) {
      best = p.w;
      intent = p.intent;
    }
  }

  let emotion: Emotion = 'neutral';
  let emotionHits = 0;
  for (const p of EMOTION_PATTERNS) {
    const hits = (ascii.match(new RegExp(p.re.source, 'g')) ?? []).length;
    if (hits > emotionHits) {
      emotionHits = hits;
      emotion = p.emotion;
    }
  }

  const topics: Topic[] = TOPIC_PATTERNS.filter((p) => p.re.test(ascii)).map((p) => p.topic);

  // Có cảm xúc rõ mà không có ý định cụ thể => đang giãi bày.
  if (intent === 'unclear' && emotion !== 'neutral') intent = 'venting';
  if (intent === 'unclear' && ascii.split(' ').length >= 12) intent = 'venting';

  let intensity: EmotionIntensity = 'medium';
  if (INTENSITY_HIGH.test(ascii) || emotionHits >= 3) intensity = 'high';
  else if (INTENSITY_LOW.test(ascii) || emotion === 'neutral') intensity = 'low';

  return { intent, emotion, intensity, topics: topics.length ? topics : ['other'], source: 'rules' };
}

/** Kiểm tra JSON từ LLM có hợp lệ không; nếu không, trả về null để dùng luật. */
export function parseIntentJson(raw: string): IntentAnalysis | null {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end < 0) return null;
    const obj = JSON.parse(raw.slice(start, end + 1)) as Partial<IntentAnalysis>;
    const intents: Intent[] = ['greeting', 'venting', 'seeking_technique', 'mood_checkin', 'asking_symptoms', 'wanting_human', 'asking_about_app', 'crisis', 'unclear'];
    const emotions: Emotion[] = ['sad', 'anxious', 'angry', 'tired', 'empty', 'lonely', 'overwhelmed', 'hopeful', 'neutral'];
    if (!obj.intent || !intents.includes(obj.intent)) return null;
    if (!obj.emotion || !emotions.includes(obj.emotion)) return null;
    const intensity: EmotionIntensity = obj.intensity === 'low' || obj.intensity === 'high' ? obj.intensity : 'medium';
    const topics = Array.isArray(obj.topics) && obj.topics.length ? (obj.topics as Topic[]) : ['other' as Topic];
    return { intent: obj.intent, emotion: obj.emotion, intensity, topics, source: 'llm' };
  } catch {
    return null;
  }
}
