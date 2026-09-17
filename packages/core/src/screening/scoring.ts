import type { RiskLevel } from '../types.ts';
import { INSTRUMENTS } from './instruments.ts';
import type { InstrumentId } from './instruments.ts';

/**
 * Chấm điểm + diễn giải KHÔNG CHẨN ĐOÁN.
 *
 * Ngưỡng theo tài liệu gốc:
 *   PHQ-9: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe
 *   GAD-7: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe
 * Chúng ta gộp thành 4 "band" hiển thị và không dùng tên bệnh trong UI.
 */

export type Band = 'minimal' | 'mild' | 'moderate' | 'high';

export interface ScreeningResult {
  instrument: InstrumentId;
  total: number;
  max: number;
  band: Band;
  /** Tiêu đề mức độ, ngôn ngữ đời thường. */
  headline: string;
  /** Giải thích ngắn. */
  explanation: string;
  /** 2–3 bước tiếp theo, theo mức độ. */
  nextSteps: string[];
  /** Câu an toàn (PHQ-9 câu 9) > 0 -> cần luồng an toàn riêng. */
  safetyFlag: boolean;
  safetyLevel: RiskLevel;
  /** Nhắc lại mốc thời gian nên làm lại. */
  retestInDays: number;
  disclaimer: string;
}

export const SCREENING_DISCLAIMER =
  'Đây là bài sàng lọc tham khảo, không phải chẩn đoán. Chỉ chuyên gia gặp trực tiếp mới có thể đánh giá đầy đủ. ' +
  'Điểm cao không có nghĩa bạn "bị bệnh", và điểm thấp không có nghĩa những gì bạn đang trải qua là không đáng kể.';

export function scoreInstrument(instrument: InstrumentId, answers: number[]): ScreeningResult {
  const inst = INSTRUMENTS[instrument];
  if (!inst) throw new Error(`Unknown instrument: ${instrument}`);
  if (answers.length !== inst.items.length) {
    throw new Error(`${instrument} cần ${inst.items.length} câu trả lời, nhận ${answers.length}`);
  }
  for (const a of answers) {
    if (!Number.isInteger(a) || a < 0 || a > 3) throw new Error(`Câu trả lời không hợp lệ: ${a}`);
  }

  const total = answers.reduce((s, a) => s + a, 0);
  const max = inst.items.length * 3;

  const safetyAnswer = inst.safetyItemIndex !== undefined ? answers[inst.safetyItemIndex]! : 0;
  const safetyFlag = safetyAnswer > 0;
  const safetyLevel: RiskLevel = safetyAnswer >= 2 ? 'high' : safetyAnswer === 1 ? 'medium' : 'none';

  const band = instrument === 'phq9' ? phqBand(total) : gadBand(total);

  const copy = instrument === 'phq9' ? PHQ_COPY[band] : GAD_COPY[band];

  return {
    instrument,
    total,
    max,
    band,
    headline: copy.headline,
    explanation: copy.explanation,
    nextSteps: safetyFlag ? [SAFETY_FIRST_STEP, ...copy.nextSteps.slice(0, 2)] : copy.nextSteps,
    safetyFlag,
    safetyLevel,
    retestInDays: band === 'minimal' ? 28 : 14,
    disclaimer: SCREENING_DISCLAIMER,
  };
}

function phqBand(total: number): Band {
  if (total <= 4) return 'minimal';
  if (total <= 9) return 'mild';
  if (total <= 14) return 'moderate';
  return 'high';
}

function gadBand(total: number): Band {
  if (total <= 4) return 'minimal';
  if (total <= 9) return 'mild';
  if (total <= 14) return 'moderate';
  return 'high';
}

const SAFETY_FIRST_STEP =
  'Bạn có trả lời rằng gần đây có lúc nghĩ mình chết đi thì tốt hơn hoặc nghĩ đến việc làm đau bản thân. Điều đó quan trọng và đáng được nói với một người thật — mình đã để các số hỗ trợ ở nút "Cần hỗ trợ ngay".';

interface BandCopy {
  headline: string;
  explanation: string;
  nextSteps: string[];
}

const PHQ_COPY: Record<Band, BandCopy> = {
  minimal: {
    headline: 'Tâm trạng của bạn hai tuần qua khá ổn',
    explanation: 'Các dấu hiệu bạn ghi nhận ở mức thấp. Điều đó không có nghĩa mọi thứ đều dễ, chỉ là chúng chưa kéo dài hay lan rộng.',
    nextSteps: [
      'Giữ thói quen check-in 30 giây mỗi ngày để nhận ra sớm nếu có gì đổi.',
      'Thử một bài kỹ năng bạn thích, khi đang ổn là lúc học dễ nhất.',
      'Làm lại bài này sau khoảng 4 tuần.',
    ],
  },
  mild: {
    headline: 'Có vài dấu hiệu đáng để ý',
    explanation: 'Bạn đang trải qua một số điều làm phiền ở mức nhẹ. Nhiều người ở mức này thấy đỡ hơn khi có vài thay đổi nhỏ và có người để nói chuyện.',
    nextSteps: [
      'Chọn một việc trong thư viện kỹ năng và thử 3 ngày liên tiếp (giấc ngủ hoặc một việc nhỏ mỗi ngày thường hiệu quả).',
      'Nói với một người bạn tin về những gì bạn đang thấy, không cần nói hết.',
      'Làm lại bài này sau 2 tuần; nếu điểm tăng, hãy cân nhắc nói với người hỗ trợ trong app.',
    ],
  },
  moderate: {
    headline: 'Các dấu hiệu ở mức đáng chú ý',
    explanation: 'Những gì bạn đang trải qua đã đủ nhiều để ảnh hưởng đến ngày thường của bạn. Đây là mức mà việc có thêm người hỗ trợ thường tạo khác biệt rõ.',
    nextSteps: [
      'Cân nhắc đặt một buổi với người lắng nghe hoặc chuyên gia trong app — 30 phút thôi cũng được.',
      'Trong lúc chờ, ưu tiên giấc ngủ và một việc nhỏ có chủ đích mỗi ngày.',
      'Làm lại bài này sau 2 tuần và mang kết quả đến buổi gặp nếu bạn muốn.',
    ],
  },
  high: {
    headline: 'Bạn đang mang khá nhiều',
    explanation: 'Điểm ở mức này cho thấy bạn đang chịu đựng nhiều hơn mức nên chịu một mình. Không phải vì bạn yếu, mà vì gánh nặng đang thật sự nặng.',
    nextSteps: [
      'Mình khuyến khích bạn nói chuyện với chuyên gia trong tuần này. Trong app có danh sách đã xác minh, có mức giá cho sinh viên.',
      'Nếu có lúc nào bạn thấy không an toàn với chính mình, hãy dùng nút "Cần hỗ trợ ngay" — bất kể giờ nào.',
      'Hãy cho một người thật biết bạn đang khó khăn, dù chỉ một câu.',
    ],
  },
};

const GAD_COPY: Record<Band, BandCopy> = {
  minimal: {
    headline: 'Mức lo lắng của bạn hai tuần qua khá thấp',
    explanation: 'Lo lắng là bình thường; ở mức này nó chưa lấn vào ngày thường của bạn.',
    nextSteps: ['Tiếp tục check-in mỗi ngày.', 'Thử một bài thở khi đang ổn để lúc cần có sẵn.', 'Làm lại sau khoảng 4 tuần.'],
  },
  mild: {
    headline: 'Có lo lắng ở mức nhẹ',
    explanation: 'Bạn có lo hơn mức thoải mái, nhưng phần lớn thời gian vẫn xoay được.',
    nextSteps: [
      'Bài "Thở 4-7-8" hoặc "Grounding 5-4-3-2-1" là hai công cụ nhanh cho những lúc lo dâng lên.',
      'Để ý xem lo thường đến vào lúc nào trong ngày, ghi vào check-in.',
      'Làm lại sau 2 tuần.',
    ],
  },
  moderate: {
    headline: 'Lo lắng ở mức đáng chú ý',
    explanation: 'Lo lắng đang chiếm khá nhiều chỗ, có thể ảnh hưởng đến giấc ngủ, tập trung và cơ thể.',
    nextSteps: [
      'Cân nhắc nói chuyện với người lắng nghe hoặc chuyên gia trong app về những gì đang làm bạn lo.',
      'Giảm caffeine và màn hình sau 22h trong 1 tuần, xem có khác không.',
      'Làm lại sau 2 tuần.',
    ],
  },
  high: {
    headline: 'Lo lắng đang ở mức cao',
    explanation: 'Mức này thường đi kèm khó ngủ, khó thở, tim đập nhanh và cảm giác không tắt được. Nó mệt, và bạn không cần tự xử một mình.',
    nextSteps: [
      'Mình khuyến khích bạn gặp chuyên gia trong tuần này — lo âu ở mức này đáp ứng khá tốt với hỗ trợ đúng cách.',
      'Trong lúc đó, bài "Thở hộp" giúp hạ nhịp khi cơ thể bùng lên.',
      'Nếu có lúc bạn thấy không an toàn, dùng nút "Cần hỗ trợ ngay".',
    ],
  },
};
