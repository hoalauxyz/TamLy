import type { Emotion, IntentAnalysis, Topic } from '../types.ts';
import { echoAnchor, pickFollowUp, topicLabel, type ThreadState } from './thread.ts';

/**
 * Kịch bản trả lời KHÔNG cần LLM.
 * Đây là đường đi mặc định cho 60–70% lượt tương tác hữu ích (kỹ năng, check-in, chào hỏi,
 * câu hỏi về triệu chứng/app) và là fallback khi LLM lỗi hoặc bị tắt.
 *
 * Mọi câu trong file này đã được viết theo nguyên tắc của system prompt:
 * không chẩn đoán, không hứa hẹn, dẫn ra khỏi chat, xưng mình–bạn.
 */

export interface ScriptedReply {
  text: string;
  /** Gợi ý hành động cho UI (chip). */
  suggestions?: Array<{ label: string; action: SuggestedAction }>;
}

export type SuggestedAction =
  | { type: 'open_skill'; skillId: string }
  | { type: 'open_screening'; instrument: 'phq9' | 'gad7' }
  | { type: 'open_checkin' }
  | { type: 'open_human_support' }
  | { type: 'open_crisis' }
  | { type: 'continue_chat'; prefill?: string };

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]!;
}

const REFLECTIONS: Record<Emotion, readonly string[]> = {
  sad: [
    'Nghe bạn kể, mình cảm nhận được một nỗi buồn khá nặng ở đó.',
    'Có gì đó làm bạn buồn thật sự, và bạn đang mang nó một mình.',
  ],
  anxious: [
    'Có vẻ như đầu bạn đang chạy trước rất nhiều thứ, và cơ thể cũng căng theo.',
    'Cái lo này nghe như nó không chịu tắt, kể cả khi bạn muốn nghỉ.',
  ],
  angry: [
    'Mình nghe thấy sự bức bối trong đó — có gì đó không công bằng với bạn.',
    'Tức giận như vậy thường là vì một điều quan trọng với bạn đã bị chạm vào.',
  ],
  tired: [
    'Nghe như bạn đã cố gắng lâu rồi và giờ chỉ còn rất ít pin.',
    'Kiểu mệt này không phải mệt vì thiếu ngủ một đêm, mà mệt vì gánh lâu quá.',
  ],
  empty: [
    'Cảm giác trống rỗng đó khó gọi tên — không hẳn buồn, không hẳn gì cả, chỉ là trống.',
    'Khi mọi thứ trở nên nhạt, ngay cả việc muốn một điều gì cũng khó.',
  ],
  lonely: [
    'Cảm giác có người quanh mình mà vẫn một mình — mình nghe thấy điều đó.',
    'Cô đơn kiểu này đau theo cách rất âm thầm.',
  ],
  overwhelmed: [
    'Có quá nhiều thứ đổ đến cùng lúc và bạn không biết cầm cái nào trước.',
    'Nghe như bạn đang bị ngập, và mỗi việc thêm vào đều nặng gấp đôi.',
  ],
  hopeful: [
    'Mình thấy có một chút nhẹ hơn trong cách bạn nói — điều đó đáng ghi nhận.',
    'Có vẻ hôm nay có gì đó dịch chuyển theo hướng tốt hơn.',
  ],
  neutral: ['Cảm ơn bạn đã chia sẻ với mình.', 'Mình đang nghe đây.'],
};

const TOPIC_TOUCH: Partial<Record<Topic, string>> = {
  family: 'Chuyện gia đình luôn khó nói, vì mình vừa thương vừa mệt.',
  study: 'Áp lực học thường không chỉ là điểm số, mà là kỳ vọng quanh bạn.',
  work: 'Năm đầu đi làm hay lúc tìm việc, nhiều người trẻ thấy mình “không đủ”.',
  relationship: 'Chuyện tình cảm chạm vào chỗ mềm, nên đau là bình thường.',
  future: 'Không biết mình đang đi đâu — cảm giác phổ biến ở tuổi này, dù ít ai nói ra.',
  money: 'Lo tiền là một cái lo rất thật, không phải chuyện nhỏ.',
  social_media: 'Mạng xã hội hay cho thấy phiên bản tốt nhất của người khác.',
  sleep: 'Ngủ kém kéo cảm xúc và tập trung xuống theo.',
  body_image: 'Cách mình nhìn cơ thể thường khắt khe hơn cách bất kỳ ai nhìn.',
};

export function scriptedVenting(
  analysis: IntentAnalysis,
  turnIndex: number,
  thread?: ThreadState,
  userText?: string,
): ScriptedReply {
  const topic = (analysis.topics.find((t) => t !== 'other') ?? thread?.stickyTopic) as Topic | undefined;
  const anchor = (userText && echoAnchor(userText)) || thread?.anchors.at(-1);
  const question = pickFollowUp(thread ?? emptyThread(turnIndex), topic, turnIndex + (userText?.length ?? 0));

  let head: string;
  if (thread?.answeringPrevious && anchor) {
    head = `Bạn vừa nói “${trimQuote(anchor)}”.`;
    if (topic && TOPIC_TOUCH[topic]) head += ` ${TOPIC_TOUCH[topic]}`;
  } else if (anchor && turnIndex > 0) {
    head = `Mình giữ “${trimQuote(anchor)}” — không bỏ qua chỗ đó.`;
    if (topic) head += ` Vẫn quanh ${topicLabel(topic)}.`;
  } else {
    const reflection = pick(REFLECTIONS[analysis.emotion], turnIndex);
    const touch = topic && TOPIC_TOUCH[topic] ? ` ${TOPIC_TOUCH[topic]}` : '';
    head = `${reflection}${touch}`;
    if (anchor) head += ` Bạn nói ${trimQuote(anchor).toLowerCase()}.`;
  }

  if (turnIndex >= 10) {
    return {
      text: `${head} Bạn đã nói ra được khá nhiều. Bạn muốn dịu cơ thể 2 phút, gặp người thật, hay kể tiếp đúng chuyện đang nói?`,
      suggestions: [
        { label: 'Thở 2 phút', action: { type: 'open_skill', skillId: 'breathing-478' } },
        { label: 'Nói với người thật', action: { type: 'open_human_support' } },
        { label: 'Kể tiếp', action: { type: 'continue_chat' } },
      ],
    };
  }

  return {
    text: `${head} ${question}`,
    suggestions: analysis.intensity === 'high'
      ? [
          { label: 'Mình muốn bình tĩnh lại', action: { type: 'open_skill', skillId: 'grounding-54321' } },
          { label: 'Kể tiếp', action: { type: 'continue_chat' } },
        ]
      : undefined,
  };
}

function trimQuote(s: string): string {
  return s.replace(/[.?!…]+$/g, '').slice(0, 72);
}

function emptyThread(turnCount: number): ThreadState {
  return {
    turnCount,
    lastUserText: '',
    lastAnText: '',
    askedQuestions: [],
    anchors: [],
    answeringPrevious: false,
  };
}

export function scriptedGreeting(turnIndex: number): ScriptedReply {
  const opts = [
    'Chào bạn. Mình là An — kể gì cũng được, mình nghe như một người bạn. Hôm nay bạn thế nào?',
    'Hi. Mình ở đây. Có gì đang nằm trong đầu bạn lúc này không?',
  ];
  return {
    text: pick(opts, turnIndex),
    suggestions: [
      { label: 'Mình đang lo', action: { type: 'continue_chat', prefill: 'Mình đang lo về ' } },
      { label: 'Mình mệt', action: { type: 'continue_chat', prefill: 'Mình thấy mệt vì ' } },
      { label: 'Muốn thở một chút', action: { type: 'open_skill', skillId: 'breathing-478' } },
    ],
  };
}

export function scriptedAskingSymptoms(): ScriptedReply {
  return {
    text:
      'Mình hiểu vì sao bạn hỏi — khi mọi thứ nặng kéo dài, ai cũng muốn có một cái tên cho nó. ' +
      'Nhưng mình là AI, mình không thể và không nên nói bạn có bị hay không; chỉ chuyên gia gặp trực tiếp mới làm được điều đó. ' +
      'Điều mình làm được là nghe bạn kể gần đây bạn thấy thế nào. Nếu bạn muốn có cái nhìn rõ hơn, trong app có một bài kiểm tra tham khảo 3 phút.',
    suggestions: [
      { label: 'Làm bài kiểm tra 3 phút', action: { type: 'open_screening', instrument: 'phq9' } },
      { label: 'Kể cho An nghe', action: { type: 'continue_chat' } },
      { label: 'Nói với chuyên gia', action: { type: 'open_human_support' } },
    ],
  };
}

export function scriptedWantingHuman(): ScriptedReply {
  return {
    text:
      'Mình nghĩ đó là một quyết định tốt. Trong app có hai lựa chọn: người lắng nghe được đào tạo (nhanh, chi phí thấp hoặc miễn phí qua trường) và chuyên gia có xác minh. ' +
      'Nếu lúc này bạn đang rất khó khăn và cần ngay, hãy dùng nút "Cần hỗ trợ ngay".',
    suggestions: [
      { label: 'Xem người hỗ trợ', action: { type: 'open_human_support' } },
      { label: 'Cần hỗ trợ ngay', action: { type: 'open_crisis' } },
    ],
  };
}

export function scriptedAboutApp(text: string): ScriptedReply {
  const asksIdentity = /\b(?:ai|nguoi that|bot|may|that|gi)\b/.test(
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  );
  return {
    text: asksIdentity
      ? 'Mình là An – một AI được tạo ra để lắng nghe. Mình không phải người thật và không thay được người thật. Tin nhắn của bạn được gửi qua máy chủ để mình trả lời, tự xóa sau 30 ngày, và bạn có thể xóa bất cứ lúc nào trong phần Cài đặt. Nếu bạn muốn nói với một người thật, mình chỉ bạn cách nhé?'
      : 'App này để bạn check-in cảm xúc mỗi ngày, có vài công cụ ngắn để tự cân bằng, và có người thật khi bạn cần. App không chẩn đoán hay điều trị gì cả. Dữ liệu của bạn được tách khỏi danh tính và bạn có toàn quyền xóa. Bạn muốn biết thêm phần nào?',
    suggestions: [
      { label: 'Người hỗ trợ thật', action: { type: 'open_human_support' } },
      { label: 'Nói tiếp với An', action: { type: 'continue_chat' } },
    ],
  };
}

export function scriptedMoodCheckin(analysis: IntentAnalysis): ScriptedReply {
  const reflection = pick(REFLECTIONS[analysis.emotion], 0);
  return {
    text: `${reflection} Bạn có muốn ghi lại nhanh cảm xúc này (30 giây) để mình cùng bạn nhìn xu hướng vài ngày tới không? Hoặc kể thêm cũng được.`,
    suggestions: [
      { label: 'Ghi lại 30 giây', action: { type: 'open_checkin' } },
      { label: 'Kể thêm', action: { type: 'continue_chat' } },
    ],
  };
}

export function scriptedTechnique(analysis: IntentAnalysis): ScriptedReply {
  const map: Partial<Record<Emotion, { id: string; label: string; intro: string }>> = {
    anxious: { id: 'breathing-478', label: 'Thở 4-7-8', intro: 'Khi lo, cơ thể thở nhanh và nông; làm chậm hơi thở ra là cách nhanh nhất để báo cho não rằng mình an toàn.' },
    overwhelmed: { id: 'grounding-54321', label: 'Grounding 5-4-3-2-1', intro: 'Khi bị ngập, kéo sự chú ý về 5 giác quan giúp đầu bớt chạy.' },
    angry: { id: 'box-breathing', label: 'Thở hộp', intro: 'Tức giận cần một nhịp chậm đều để hạ nhiệt trước khi mình quyết định gì.' },
    sad: { id: 'thought-record', label: 'Ghi lại suy nghĩ', intro: 'Viết ra suy nghĩ đang lặp trong đầu giúp mình nhìn nó từ ngoài, thay vì ở trong nó.' },
    tired: { id: 'behavioral-activation', label: 'Một việc nhỏ', intro: 'Khi hết pin, chờ có động lực rồi mới làm thường không hiệu quả; làm một việc rất nhỏ trước, động lực đến sau.' },
    empty: { id: 'behavioral-activation', label: 'Một việc nhỏ', intro: 'Khi trống rỗng, một hành động nhỏ có chủ đích là cách nhẹ nhất để chạm lại vào cảm giác.' },
    lonely: { id: 'reach-out', label: 'Nhắn một tin', intro: 'Cô đơn hay nói với mình rằng không ai muốn nghe — thường điều đó không đúng.' },
    neutral: { id: 'breathing-478', label: 'Thở 4-7-8', intro: 'Một bài thở ngắn là điểm bắt đầu tốt cho hầu hết mọi lúc.' },
    hopeful: { id: 'gratitude-3', label: '3 điều hôm nay', intro: 'Khi thấy nhẹ hơn, ghi lại giúp giữ nó lâu hơn một chút.' },
  };
  const s = map[analysis.emotion] ?? map.neutral!;
  return {
    text: `${s.intro} Mình có bài "${s.label}" khoảng 2–3 phút, bạn thử không? Mình sẽ đi cùng từng bước.`,
    suggestions: [
      { label: `Bắt đầu: ${s.label}`, action: { type: 'open_skill', skillId: s.id } },
      { label: 'Để sau, kể tiếp', action: { type: 'continue_chat' } },
    ],
  };
}

export function scriptedUnclear(thread?: ThreadState): ScriptedReply {
  if (thread?.stickyTopic) {
    return {
      text: `Mình muốn hiểu đúng ${topicLabel(thread.stickyTopic)} bạn đang nói. Bạn kể thêm một chi tiết được không — chuyện gì vừa xảy ra, hoặc bạn đang thấy thế nào lúc này?`,
    };
  }
  return {
    text: 'Mình chưa chắc mình hiểu đúng ý bạn. Bạn có thể nói thêm một chút được không — chuyện gì đang xảy ra, hoặc bạn đang thấy thế nào?',
  };
}

/** Phản hồi ở mức medium: hỏi xác nhận nhẹ, không hoảng, đưa tài nguyên bên cạnh. */
export function scriptedMediumRiskCheck(): ScriptedReply {
  return {
    text:
      'Mình nghe thấy có gì đó rất nặng trong điều bạn vừa nói, và mình muốn hiểu đúng. ' +
      'Mình hỏi thẳng một câu, bạn trả lời thật với mình nhé: lúc này bạn có đang nghĩ đến việc làm hại bản thân không?',
    suggestions: [
      { label: 'Có', action: { type: 'open_crisis' } },
      { label: 'Không, mình chỉ đang rất mệt', action: { type: 'continue_chat', prefill: 'Không, mình chỉ đang rất mệt. ' } },
      { label: 'Mình muốn nói với người thật', action: { type: 'open_human_support' } },
    ],
  };
}

/** Phản hồi ngắn đi kèm màn hình khẩn cấp (màn hình mới là thứ chính). */
export function scriptedHighRiskReply(thirdParty: boolean): ScriptedReply {
  return {
    text: thirdParty
      ? 'Cảm ơn bạn đã không bỏ qua điều này. Mình đã mở hướng dẫn và các số hỗ trợ bên dưới — hãy ở bên họ và cùng gọi.'
      : 'Mình nghe bạn. Cảm ơn bạn đã nói ra điều này với mình. Lúc này bạn cần một người thật ở bên — mình đã mở các số hỗ trợ bên dưới. Bạn không phải chịu đựng một mình.',
    suggestions: [{ label: 'Xem hỗ trợ', action: { type: 'open_crisis' } }],
  };
}
