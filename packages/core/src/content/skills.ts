/**
 * Thư viện kỹ năng micro (2–5 phút). Nội dung dựa trên CBT/ACT/kỹ thuật điều hòa cơ thể
 * đã được dùng rộng rãi; KHÔNG phải trị liệu. Cần cố vấn lâm sàng rà lại trước khi ra mắt.
 */

export type SkillCategory = 'breathe' | 'ground' | 'think' | 'act' | 'sleep' | 'connect' | 'digital';

export interface SkillStep {
  text: string;
  /** Giây đếm ngược (nếu có) để UI hiển thị timer. */
  seconds?: number;
}

export interface Skill {
  id: string;
  title: string;
  category: SkillCategory;
  minutes: number;
  /** Khi nào dùng — một câu. */
  when: string;
  /** Tại sao hiệu quả — một câu, không thuật ngữ. */
  why: string;
  steps: SkillStep[];
  /** Câu kết, không hứa hẹn. */
  closing: string;
}

export const SKILLS: Skill[] = [
  {
    id: 'breathing-478',
    title: 'Thở 4-7-8',
    category: 'breathe',
    minutes: 2,
    when: 'Khi lo lắng, tim đập nhanh, khó ngủ.',
    why: 'Thở ra dài hơn hít vào là tín hiệu đơn giản nhất để cơ thể chuyển sang chế độ nghỉ.',
    steps: [
      { text: 'Ngồi hoặc nằm thoải mái. Đặt một tay lên bụng.' },
      { text: 'Thở ra hết bằng miệng.' },
      { text: 'Hít vào bằng mũi, đếm 4.', seconds: 4 },
      { text: 'Giữ hơi, đếm 7.', seconds: 7 },
      { text: 'Thở ra bằng miệng thật chậm, đếm 8.', seconds: 8 },
      { text: 'Lặp lại 4 vòng. Nếu chóng mặt, thở bình thường một lúc rồi tiếp.' },
    ],
    closing: 'Không cần thấy khác ngay. Cơ thể cần vài vòng để nhận tín hiệu.',
  },
  {
    id: 'box-breathing',
    title: 'Thở hộp (4-4-4-4)',
    category: 'breathe',
    minutes: 2,
    when: 'Khi tức giận, trước khi nói/quyết định điều gì quan trọng.',
    why: 'Nhịp đều bốn cạnh giúp đầu và cơ thể cùng chậm lại một nhịp.',
    steps: [
      { text: 'Hít vào, đếm 4.', seconds: 4 },
      { text: 'Giữ, đếm 4.', seconds: 4 },
      { text: 'Thở ra, đếm 4.', seconds: 4 },
      { text: 'Giữ rỗng, đếm 4.', seconds: 4 },
      { text: 'Lặp lại 5 vòng. Tưởng tượng vẽ một hình vuông theo từng cạnh.' },
    ],
    closing: 'Xong rồi thì hãy hỏi mình: giờ mình muốn làm gì, thay vì mình muốn phản ứng gì.',
  },
  {
    id: 'grounding-54321',
    title: 'Grounding 5-4-3-2-1',
    category: 'ground',
    minutes: 3,
    when: 'Khi đầu chạy quá nhanh, cảm giác không thật, hoảng.',
    why: 'Kéo sự chú ý về giác quan đưa bạn về "ở đây, bây giờ" thay vì ở trong nỗi lo.',
    steps: [
      { text: 'Nhìn quanh và gọi tên 5 thứ bạn THẤY. Nói thầm hoặc nói to.' },
      { text: '4 thứ bạn có thể CHẠM. Chạm thật vào chúng, để ý nhiệt độ, chất liệu.' },
      { text: '3 âm thanh bạn NGHE thấy lúc này.' },
      { text: '2 mùi bạn NGỬI được (hoặc 2 mùi bạn thích).' },
      { text: '1 vị bạn NẾM được, hoặc uống một ngụm nước và để ý vị của nó.' },
    ],
    closing: 'Bạn vẫn ở đây. Cơn sóng đã qua một phần rồi.',
  },
  {
    id: 'thought-record',
    title: 'Ghi lại một suy nghĩ',
    category: 'think',
    minutes: 5,
    when: 'Khi một suy nghĩ cứ lặp lại và kéo bạn xuống.',
    why: 'Viết ra giúp bạn nhìn suy nghĩ từ bên ngoài, thay vì ở bên trong nó. Suy nghĩ là suy nghĩ, chưa chắc là sự thật.',
    steps: [
      { text: 'Viết đúng câu đang lặp trong đầu. Ví dụ: "Mình sẽ trượt và làm bố mẹ thất vọng."' },
      { text: 'Chấm mức tin vào nó lúc này, 0–100%.' },
      { text: 'Bằng chứng ủng hộ suy nghĩ này là gì? Viết thật.' },
      { text: 'Bằng chứng ngược lại là gì? Kể cả những cái nhỏ.' },
      { text: 'Nếu một người bạn thân nói với bạn câu đó về họ, bạn sẽ nói gì với họ?' },
      { text: 'Viết lại câu ban đầu theo cách cân bằng hơn. Chấm lại mức tin.' },
    ],
    closing: 'Mục tiêu không phải nghĩ tích cực, mà là nghĩ đúng hơn.',
  },
  {
    id: 'behavioral-activation',
    title: 'Một việc nhỏ',
    category: 'act',
    minutes: 5,
    when: 'Khi hết pin, không muốn làm gì, mọi thứ nhạt.',
    why: 'Chờ có động lực rồi làm thường không xảy ra. Làm một việc rất nhỏ trước — động lực đến sau hành động.',
    steps: [
      { text: 'Chọn MỘT việc mất dưới 5 phút và hơi có ý nghĩa với bạn: rửa mặt, mở cửa sổ, gấp chăn, nhắn một tin, đi lấy nước.' },
      { text: 'Đặt hẹn giờ 5 phút. Chỉ làm đúng việc đó, không thêm.' },
      { text: 'Làm xong, ghi lại: trước khi làm bạn thấy thế nào (0–10), sau khi làm thế nào (0–10).' },
      { text: 'Nếu có sức, chọn việc nhỏ thứ hai. Nếu không, dừng ở đây là đủ.' },
    ],
    closing: 'Một việc là một việc. Hôm nay bạn đã làm một việc.',
  },
  {
    id: 'sleep-reset',
    title: 'Đặt lại giấc ngủ',
    category: 'sleep',
    minutes: 4,
    when: 'Khi bạn thức khuya, ngủ chập chờn, sáng dậy vẫn mệt.',
    why: 'Giấc ngủ kéo mọi thứ khác theo — cảm xúc, kiên nhẫn, tập trung. Vài quy tắc nhỏ giữ đều trong 1 tuần thường thấy khác.',
    steps: [
      { text: 'Chọn một giờ dậy cố định cho 7 ngày, kể cả cuối tuần. Giờ dậy quan trọng hơn giờ ngủ.' },
      { text: 'Sau 22h: điện thoại ở chế độ tối, để xa giường một tầm tay.' },
      { text: 'Nếu nằm 20 phút không ngủ được, đứng dậy làm gì đó nhẹ trong ánh sáng mờ, rồi quay lại.' },
      { text: 'Không caffeine sau 14h trong tuần này.' },
      { text: 'Ghi vào check-in mỗi sáng: ngủ mấy tiếng, dậy thấy thế nào.' },
    ],
    closing: 'Đừng cố ngủ. Chỉ tạo điều kiện, rồi để cơ thể làm phần còn lại.',
  },
  {
    id: 'digital-boundary',
    title: 'Ranh giới với mạng xã hội',
    category: 'digital',
    minutes: 3,
    when: 'Khi lướt xong thấy tệ hơn, so sánh mình với người khác.',
    why: 'Mạng cho bạn thấy phiên bản tốt nhất của người khác và phiên bản mệt nhất của bạn. Đó không phải so sánh công bằng.',
    steps: [
      { text: 'Mở app bạn hay lướt nhất. Xem 10 bài đầu, sau mỗi bài hỏi: "Sau khi xem, mình thấy tốt hơn hay tệ hơn?"' },
      { text: 'Bỏ theo dõi hoặc ẩn 3 tài khoản làm bạn thấy tệ nhất. Không cần lý do.' },
      { text: 'Đặt giới hạn 30 phút/ngày cho app đó trong 7 ngày (cài đặt điện thoại có sẵn).' },
      { text: 'Thay 10 phút lướt buổi tối bằng một việc khác bạn chọn trước.' },
    ],
    closing: 'Bạn không cần bỏ mạng. Chỉ cần mạng bớt quyết định cảm xúc của bạn.',
  },
  {
    id: 'gratitude-3',
    title: '3 điều hôm nay',
    category: 'think',
    minutes: 2,
    when: 'Cuối ngày, hoặc khi mọi thứ có vẻ toàn xám.',
    why: 'Não mình được cài đặt để tìm nguy hiểm. Bài này chỉ đơn giản là tập cho nó tìm thêm thứ khác.',
    steps: [
      { text: 'Viết 3 điều nhỏ hôm nay không tệ. Nhỏ thôi: cốc nước mát, một tin nhắn, trời không mưa.' },
      { text: 'Với mỗi điều, thêm một dòng: vì sao nó xảy ra / ai góp phần.' },
      { text: 'Đọc lại một lần.' },
    ],
    closing: 'Đây không phải để phủ nhận điều tệ. Là để điều tệ không chiếm hết khung hình.',
  },
  {
    id: 'reach-out',
    title: 'Nhắn một tin',
    category: 'connect',
    minutes: 3,
    when: 'Khi cô đơn, khi nghĩ "chẳng ai muốn nghe mình".',
    why: 'Cô đơn hay nói rằng người khác không quan tâm. Hầu hết thời gian, điều đó không đúng — họ chỉ không biết.',
    steps: [
      { text: 'Nghĩ đến một người bạn từng thấy thoải mái khi ở bên, dù lâu không nói chuyện.' },
      { text: 'Nhắn một tin đơn giản, không cần giải thích: "Ê, lâu rồi. Dạo này thế nào?" hoặc "Hôm nay mình hơi down, nhắn cho cậu tí."' },
      { text: 'Gửi. Rồi đặt điện thoại xuống 10 phút, không chờ.' },
    ],
    closing: 'Bạn vừa làm điều khó nhất: mở lời. Phần còn lại không hoàn toàn nằm ở bạn.',
  },
  {
    id: 'talk-to-parents',
    title: 'Nói với bố mẹ như thế nào',
    category: 'connect',
    minutes: 5,
    when: 'Khi bạn muốn gia đình biết bạn đang khó khăn nhưng sợ bị phán xét hoặc không được hiểu.',
    why: 'Nhiều bố mẹ ở mình không có từ ngữ cho chuyện này, không phải không quan tâm. Chuẩn bị trước giúp cuộc nói chuyện ít lệch hướng hơn.',
    steps: [
      { text: 'Chọn thời điểm: lúc yên, không phải giữa bữa cơm hay lúc đang cãi nhau. Có thể nói "Con muốn nói với bố/mẹ một chuyện, khoảng 10 phút thôi."' },
      { text: 'Bắt đầu bằng cảm giác, không phải kết luận. "Gần đây con thấy mệt và buồn nhiều, kéo dài mấy tuần rồi" thay vì "Con nghĩ con bị trầm cảm."' },
      { text: 'Nói rõ bạn cần gì: được nghe, được đi gặp chuyên gia, hay chỉ cần bố mẹ biết. Bố mẹ thường muốn "sửa" ngay — nói trước điều bạn cần giúp họ.' },
      { text: 'Chuẩn bị cho phản ứng chưa như mong đợi ("Có gì đâu mà buồn"). Đó thường là lo lắng nói bằng cách khác. Có thể đáp: "Con biết bố mẹ lo. Con chỉ cần bố mẹ biết là con đang cố."' },
      { text: 'Nếu quá khó nói trực tiếp, viết một tin nhắn hoặc thư. Hoặc nhờ một người lớn khác bạn tin (cô, dì, thầy cô) mở lời cùng.' },
    ],
    closing: 'Một cuộc nói chuyện không cần giải quyết hết. Nó chỉ cần mở cửa.',
  },
];

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id);
}

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  breathe: 'Thở & thư giãn',
  ground: 'Về hiện tại',
  think: 'Suy nghĩ',
  act: 'Hành động',
  sleep: 'Giấc ngủ',
  connect: 'Kết nối',
  digital: 'Mạng xã hội',
};
