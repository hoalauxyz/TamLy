/**
 * Bộ câu hỏi sàng lọc.
 *
 * PHQ-9 và GAD-7 thuộc phạm vi công cộng (Pfizer), được dùng rộng rãi ở VN.
 * Bản dịch dưới đây bám sát các bản tiếng Việt đang lưu hành; TRƯỚC KHI RA MẮT phải được
 * cố vấn lâm sàng rà lại từng câu và ưu tiên dùng bản đã được kiểm định (validated) nếu có.
 *
 * Kết quả là SÀNG LỌC THAM KHẢO, không phải chẩn đoán. Ngôn ngữ trả về cố ý tránh
 * tên bệnh ("trầm cảm mức độ vừa") và dùng ngôn ngữ mức độ ("dấu hiệu ở mức đáng chú ý").
 */

export type InstrumentId = 'phq9' | 'gad7';

export interface Instrument {
  id: InstrumentId;
  title: string;
  intro: string;
  timeframe: string;
  options: readonly { value: 0 | 1 | 2 | 3; label: string }[];
  items: readonly string[];
  /** Chỉ số câu (0-based) kích hoạt luồng an toàn khi > 0. */
  safetyItemIndex?: number;
}

const OPTIONS = [
  { value: 0, label: 'Không ngày nào' },
  { value: 1, label: 'Vài ngày' },
  { value: 2, label: 'Hơn nửa số ngày' },
  { value: 3, label: 'Gần như mỗi ngày' },
] as const;

export const PHQ9: Instrument = {
  id: 'phq9',
  title: 'Kiểm tra tâm trạng (PHQ-9)',
  intro: 'Bài này giúp bạn nhìn lại 2 tuần gần đây. Không có câu trả lời đúng hay sai, và kết quả chỉ để tham khảo.',
  timeframe: 'Trong 2 tuần vừa qua, bạn có thường bị làm phiền bởi những điều sau không?',
  options: OPTIONS,
  items: [
    'Ít hứng thú hoặc ít thấy vui khi làm mọi việc',
    'Cảm thấy buồn, chán nản, hoặc tuyệt vọng',
    'Khó đi vào giấc ngủ, khó ngủ liền mạch, hoặc ngủ quá nhiều',
    'Cảm thấy mệt mỏi hoặc ít năng lượng',
    'Ăn kém ngon hoặc ăn quá nhiều',
    'Cảm thấy không hài lòng về bản thân — hoặc thấy mình thất bại, làm bản thân hay gia đình thất vọng',
    'Khó tập trung vào việc gì đó, như đọc sách hay xem tivi/điện thoại',
    'Cử động hoặc nói chậm hơn hẳn bình thường — hoặc ngược lại, bồn chồn, đứng ngồi không yên hơn bình thường',
    'Có những suy nghĩ rằng mình chết đi thì tốt hơn, hoặc nghĩ đến việc làm đau bản thân theo cách nào đó',
  ],
  safetyItemIndex: 8,
};

export const GAD7: Instrument = {
  id: 'gad7',
  title: 'Kiểm tra mức lo lắng (GAD-7)',
  intro: 'Bài này xem mức lo lắng của bạn trong 2 tuần gần đây. Kết quả chỉ để tham khảo.',
  timeframe: 'Trong 2 tuần vừa qua, bạn có thường bị làm phiền bởi những điều sau không?',
  options: OPTIONS,
  items: [
    'Cảm thấy bồn chồn, lo lắng, hoặc căng thẳng',
    'Không thể ngừng hoặc kiểm soát được sự lo lắng',
    'Lo lắng quá nhiều về nhiều chuyện khác nhau',
    'Khó thư giãn',
    'Bồn chồn đến mức khó ngồi yên',
    'Dễ bực bội hoặc cáu kỉnh',
    'Cảm thấy sợ, như thể có điều gì tồi tệ sắp xảy ra',
  ],
};

export const INSTRUMENTS: Record<InstrumentId, Instrument> = { phq9: PHQ9, gad7: GAD7 };
