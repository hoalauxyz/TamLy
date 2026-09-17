/**
 * Gói tri thức tự chăm sóc đã biên soạn (tiếng Việt).
 *
 * Đây KHÔNG phải bản quyền bài báo, KHÔNG phải fine-tune, KHÔNG phải chẩn đoán.
 * Mỗi mục là nguyên lý phổ biến (CBT / ACT / vệ sinh giấc ngủ / kích hoạt hành vi)
 * viết lại bằng lời đời thường, có nguồn gốc công khai, để An nói đúng tình huống.
 *
 * Cập nhật thêm: merge JSON đã người duyệt (reviewed: true) — xem retrieve.mergeKnowledge.
 */

import type { Topic } from '../types.ts';

export type SituationId =
  | 'exam_stress'
  | 'family_pressure'
  | 'work_burnout'
  | 'heartbreak'
  | 'loneliness'
  | 'rumination'
  | 'sleep_debt'
  | 'social_compare'
  | 'future_fog'
  | 'money_stress'
  | 'homesickness'
  | 'body_shame'
  | 'need_human'
  | 'general';

export interface KnowledgeDoc {
  id: string;
  title: string;
  situations: SituationId[];
  topics: Topic[];
  tags: string[];
  /** 1–3 câu dùng được trong hội thoại. Không chẩn đoán, không thuốc. */
  counsel: string;
  /** Câu hỏi mở đúng tình huống. */
  ask: string;
  skillId?: string;
  source: string;
  reviewed: true;
}

export const KNOWLEDGE_PACK_VERSION = 'lang-knowledge-2026.09.2';

export const KNOWLEDGE_PACK: readonly KnowledgeDoc[] = [
  {
    id: 'exam-body',
    title: 'Áp lực thi và cơ thể',
    situations: ['exam_stress'],
    topics: ['study'],
    tags: ['thi', 'học', 'deadline', 'tim đập', 'không vào bài', 'ôn'],
    counsel:
      'Khi thi gần, não hay chuyển sang chế độ chạy — tim nhanh, bụng rối, bài “không vào”. Đó là phản ứng cảnh giác, chưa phải kết luận về năng lực. Làm chậm hơi thở ra rồi chia bài thành một việc nhỏ thường đỡ hơn cố nhồi thêm.',
    ask: 'Bạn đang kẹt vì khối lượng bài, hay vì cảm giác mình sẽ không kịp?',
    skillId: 'breathing-478',
    source: 'Nguyên lý down-regulation + chia nhỏ nhiệm vụ (CBT hành vi), biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'family-expect',
    title: 'Kỳ vọng gia đình',
    situations: ['family_pressure'],
    topics: ['family', 'study'],
    tags: ['bố mẹ', 'so sánh', 'con nhà người ta', 'kỳ vọng', 'về nhà'],
    counsel:
      'Chuyện nhà nặng vì vừa thương vừa mệt. Lời so sánh thường nhằm “thúc”, nhưng với người nghe nó thành “mình không đủ”. Bạn không cần giải quyết cả gia đình trong một tối — chỉ cần gọi đúng cảm giác đang có.',
    ask: 'Phần nào chạm nhất: lời họ nói, ánh mắt, hay im lặng sau đó?',
    source: 'Nguyên lý xác nhận cảm xúc + ranh giới, biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'burnout-small',
    title: 'Hết pin vì gánh lâu',
    situations: ['work_burnout'],
    topics: ['work'],
    tags: ['làm', 'sếp', 'ot', 'burnout', 'thử việc', 'kpi', 'không đủ'],
    counsel:
      'Mệt vì gánh lâu khác mệt một đêm. Chờ có động lực rồi mới làm thường khiến vòng xoay nặng hơn. Một việc rất nhỏ, xong trong 10 phút, là cách nhẹ để não thấy “mình vẫn cử động được”.',
    ask: 'Việc nhỏ nhất hôm nay bạn vẫn làm được, dù không muốn, là gì?',
    skillId: 'behavioral-activation',
    source: 'Kích hoạt hành vi (behavioral activation), biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'heartbreak',
    title: 'Chia tay / tổn thương tình cảm',
    situations: ['heartbreak'],
    topics: ['relationship'],
    tags: ['chia tay', 'người yêu', 'nhớ', 'phản bội', 'crush'],
    counsel:
      'Đau sau chia tay không phải “yếu”. Não vừa mất một nguồn an toàn và thói quen. Không cần quyết định yêu lại hay quên ngay — cần không ở một mình với vòng suy nghĩ cả đêm.',
    ask: 'Bạn đang nhớ, đang giận, hay đang trống vì không biết làm gì với khoảng thời gian từng dành cho họ?',
    source: 'Mất gắn kết / đau xã hội, biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'lonely',
    title: 'Cô đơn giữa đám đông',
    situations: ['loneliness', 'homesickness'],
    topics: ['friends', 'family'],
    tags: ['cô đơn', 'một mình', 'xa nhà', 'không ai hiểu', 'bạn'],
    counsel:
      'Cô đơn không luôn là thiếu người quanh. Nhiều khi là thiếu chỗ được hiểu. Một tin nhắn vụng về vẫn thật hơn chờ cảm giác “đủ ổn rồi hãy gặp”.',
    ask: 'Bạn thiếu một người cụ thể, hay thiếu cảm giác thuộc về?',
    skillId: 'reach-out',
    source: 'Thuộc về xã hội (belonging), biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'ruminate',
    title: 'Suy nghĩ quay vòng',
    situations: ['rumination'],
    topics: ['other', 'study', 'future'],
    tags: ['nghĩ mãi', 'không tắt', 'lặp', 'giá như', 'tại sao'],
    counsel:
      'Nghĩ đi nghĩ lại trông giống giải quyết vấn đề, nhưng nếu không có bước làm được thì nó chỉ mài cảm xúc. Ghi ra một câu “mình đang nghĩ …” rồi hỏi: đây là việc cần làm, hay là lo không có đáp án hôm nay?',
    ask: 'Vòng nghĩ này có một việc bạn làm được trong 10 phút không, hay nó chỉ hỏi những câu không trả lời được lúc này?',
    skillId: 'thought-record',
    source: 'Phân biệt rumination và problem-solving (CBT), biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'sleep',
    title: 'Ngủ kém kéo cảm xúc',
    situations: ['sleep_debt'],
    topics: ['sleep'],
    tags: ['ngủ', 'mất ngủ', 'thức', 'đêm', 'ác mộng'],
    counsel:
      'Thiếu ngủ làm lo và buồn to hơn sự thật ban ngày. Không cần “ngủ cho đúng giáo khoa” tối nay — giảm sáng màn hình, ra khỏi giường nếu đã nằm lâu không ngủ, và không tự kết luận về bản thân lúc 2 giờ sáng.',
    ask: 'Bạn khó vào giấc, hay tỉnh giữa đêm rồi đầu chạy không tắt?',
    source: 'Vệ sinh giấc ngủ cơ bản, biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'compare',
    title: 'So sánh trên mạng',
    situations: ['social_compare'],
    topics: ['social_media', 'body_image'],
    tags: ['tiktok', 'instagram', 'so sánh', 'like', 'xấu', 'body'],
    counsel:
      'Mạng cho thấy bản tốt nhất của người khác và bản mệt nhất của mình. So sánh đó không công bằng về dữ liệu. Giảm liều lướt một buổi tối không chữa hết, nhưng thường làm cái “mình kém” bớt ồn.',
    ask: 'Sau khi lướt, câu bạn nói với mình thường là gì?',
    source: 'So sánh xã hội, biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'future',
    title: 'Không biết mình đang đi đâu',
    situations: ['future_fog'],
    topics: ['future', 'study'],
    tags: ['tương lai', 'ngành', 'ra trường', 'lạc', '25 tuổi'],
    counsel:
      'Không có bản đồ tuổi 20 là chuyện rất thường, dù ít ai nói. Không cần chọn cả đời tối nay. Một hướng thử trong 2–4 tuần (một môn, một việc làm thêm, một người hỏi) đáng hơn nghĩ “sai là hỏng hết”.',
    ask: 'Bạn đang không biết chọn gì, hay biết rồi mà sợ chọn sai?',
    source: 'Quyết định dưới bất định, biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'money',
    title: 'Lo tiền là lo thật',
    situations: ['money_stress'],
    topics: ['money'],
    tags: ['tiền', 'học phí', 'nợ', 'làm thêm', 'thuê nhà'],
    counsel:
      'Lo tiền không phải “suy nghĩ tiêu cực”. Nó là tín hiệu đời sống. An không tính được ngân sách giúp bạn — nhưng có thể ngồi với cái căng đó, rồi tách: khoản nào tháng này, khoản nào là nỗi sợ phía trước.',
    ask: 'Cái đang đè nhất là tháng này, hay là cảm giác mình không được phép yếu?',
    source: 'Căng thẳng thực tế (realistic stress), biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'body-shame',
    title: 'Hình ảnh bản thân',
    situations: ['body_shame'],
    topics: ['body_image'],
    tags: ['béo', 'gầy', 'xấu', 'mụn', 'cân nặng', 'tự ti', 'gương'],
    counsel:
      'Cái nhìn vào gương hay cân thường gay hơn sự thật người khác thấy. Não hay soi một điểm rồi phóng to. Không cần “yêu bản thân” ngay — chỉ cần không ra quyết định lớn (ăn kiêng cực, so ảnh) lúc đang soi.',
    ask: 'Bạn đang khó chịu vì một chỗ cụ thể, hay vì cảm giác mình không được phép xuất hiện?',
    source: 'Hình ảnh cơ thể / soi điểm (body checking), biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'cbt-triangle',
    title: 'Suy nghĩ – cảm xúc – việc làm',
    situations: ['rumination', 'exam_stress', 'general'],
    topics: ['other'],
    tags: ['suy nghĩ', 'cảm xúc', 'tự trách', 'mình kém'],
    counsel:
      'Một câu trong đầu (“mình kém”) có thể kéo cảm xúc xuống rồi kéo việc làm theo. Gọi tên câu đó như một câu, không phải sự thật, thường làm khoảng trống nhỏ để thở. Không cần “nghĩ tích cực” — chỉ cần nhìn nó từ ngoài.',
    ask: 'Câu đang lặp trong đầu bạn, nếu viết nguyên văn, là gì?',
    skillId: 'thought-record',
    source: 'Tam giác CBT phổ biến, biên soạn nội bộ.',
    reviewed: true,
  },
  {
    id: 'when-human',
    title: 'Khi nào AI không đủ',
    situations: ['need_human', 'general'],
    topics: ['other'],
    tags: ['kéo dài', 'hai tuần', 'không ăn', 'không ngủ', 'chuyên gia'],
    counsel:
      'Nếu chuyện nặng đã kéo dài khoảng hai tuần, ăn–ngủ–học–làm đảo, hoặc bạn muốn một người thật: An không thay được. Đó không phải thất bại khi kể chuyện — đó là đúng chỗ cần người có chuyên môn.',
    ask: 'Bạn muốn mình tiếp tục nghe, hay muốn xem người hỗ trợ / bài kiểm tra tham khảo?',
    source: 'Ngưỡng chuyển tuyến tự chăm sóc → người thật, biên soạn nội bộ.',
    reviewed: true,
  },
];

export const SITUATION_LABEL: Record<SituationId, string> = {
  exam_stress: 'Áp lực học / thi',
  family_pressure: 'Kỳ vọng gia đình',
  work_burnout: 'Mệt vì việc',
  heartbreak: 'Tình cảm',
  loneliness: 'Cô đơn',
  rumination: 'Suy nghĩ quay vòng',
  sleep_debt: 'Ngủ kém',
  social_compare: 'So sánh',
  future_fog: 'Hướng đi',
  money_stress: 'Lo tiền',
  homesickness: 'Xa nhà',
  body_shame: 'Hình ảnh bản thân',
  need_human: 'Cần người thật',
  general: 'Đang lắng nghe',
};
