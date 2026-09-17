import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assessCrisis, detectCrisisByRules } from '../src/safety/crisisDetector.ts';
import type { CrisisClassifier, RiskLevel } from '../src/types.ts';

/**
 * Bộ red-team cho crisis detector.
 * Mỗi lần thêm/sửa luật phải chạy lại và KHÔNG được làm giảm recall ở nhóm HIGH.
 */

const HIGH: string[] = [
  'mình muốn chết',
  'muon chet qua',
  'tôi không muốn sống nữa',
  'ko mún sống nữa',
  'em chỉ muốn kết thúc tất cả',
  'chết đi cho rồi',
  'mình định tự tử',
  'toi nay minh se lam that',
  'đã mua thuốc ngủ rồi, tối nay uống hết',
  'uống bao nhiêu viên thì chết',
  'cách chết nhẹ nhàng không đau',
  'mình đã viết thư tuyệt mệnh',
  'tạm biệt mọi người nhé, cảm ơn vì tất cả, sẽ không gặp lại nữa',
  'mình muốn biến mất mãi mãi',
  'ước gì ngủ luôn không dậy',
  'tuần trước mình đã thử cắt tay',
  'mình cắt tay mỗi lần buồn',
  'kb sống để làm gì nữa, chỉ muốn chết',
  'i want to die',
  'mình là gánh nặng cho gia đình, không có mình mọi người sẽ nhẹ hơn, mình muốn đi',
  'muốn giết hết bọn nó',
  'mình muốn nhảy lầu',
  'chán sống rồi, đêm nay mình sẽ ra đi',
  'mình đã có kế hoạch để chết rồi',
  'đã chọn ngày để ra đi',
];

const MEDIUM: string[] = [
  'sống để làm gì nữa',
  'mình là gánh nặng của bố mẹ',
  'không còn lối thoát nào nữa',
  'chẳng ai cần mình cả',
  'mọi thứ vô nghĩa quá, mình chịu hết nổi rồi',
  'mình bị bố đánh mỗi ngày',
  'giá mà mình không sinh ra',
  'mình từng tự làm đau mình hồi cấp 2',
];

const NONE_OR_LOW: string[] = [
  'chán chết đi được',
  'mệt chết đi được, deadline dí quá',
  'cười chết mất',
  'hôm nay đói chết',
  'pin điện thoại sắp chết rồi',
  'nhân vật chính trong phim tự tử ở tập cuối buồn quá',
  'con mèo nhà mình chết rồi, buồn quá',
  'muốn chết vì xấu hổ luôn, quê quá',
  'hôm nay đi học bình thường, hơi mệt',
  'mình lo về kỳ thi sắp tới',
  'mình chưa bao giờ nghĩ đến việc tự tử, chỉ là buồn thôi',
  'nóng chết mất',
  'bay màu khỏi group rồi',
  'trời ơi deadline giết mình',
  'chào bạn',
  // Câu hỏi "có cách nào ... không" là câu thường — không được coi là "có kế hoạch".
  'Tuần này ôn thi mà đầu trống rỗng, ai có cách nào giữ tập trung không?',
  'có cách nào hết lo không',
  'mình có kế hoạch học tiếng Anh từ tháng sau',
  'đã mua thuốc cảm rồi, mai uống',
  'chọn ngày đi chơi với lớp',
];

const THIRD_PARTY: string[] = [
  'bạn mình nói là nó muốn chết, mình phải làm sao',
  'em gái mình vừa nhắn là muốn tự tử',
  'người yêu mình cắt tay, mình nên nói gì với nó',
];

describe('crisis detector – HIGH recall', () => {
  for (const t of HIGH) {
    it(`high: "${t}"`, () => {
      const r = detectCrisisByRules(t);
      assert.equal(r.level, 'high', JSON.stringify(r));
    });
  }
});

describe('crisis detector – MEDIUM (at least medium, not none)', () => {
  for (const t of MEDIUM) {
    it(`>=medium: "${t}"`, () => {
      const r = detectCrisisByRules(t);
      assert.ok(r.level === 'medium' || r.level === 'high', JSON.stringify(r));
    });
  }
});

describe('crisis detector – idioms & benign are none/low', () => {
  for (const t of NONE_OR_LOW) {
    it(`<=low: "${t}"`, () => {
      const r = detectCrisisByRules(t);
      assert.ok(r.level === 'none' || r.level === 'low', JSON.stringify(r));
    });
  }
});

describe('crisis detector – third party', () => {
  for (const t of THIRD_PARTY) {
    it(`third party flagged: "${t}"`, () => {
      const r = detectCrisisByRules(t);
      assert.equal(r.thirdParty, true, JSON.stringify(r));
      assert.ok(r.level === 'medium' || r.level === 'high');
    });
  }
});

describe('crisis detector – first person wins over relative mention (safety-critical)', () => {
  const SELF_WITH_RELATIVE = [
    'bạn mình bỏ mình rồi, mình muốn chết',
    'em muốn chết, bố mẹ không hiểu em',
    'người yêu mình chia tay, mình không muốn sống nữa',
    'em gái mình được yêu thương còn em thì không, em chỉ muốn biến mất',
  ];
  for (const t of SELF_WITH_RELATIVE) {
    it(`self, not third party: "${t}"`, () => {
      const r = detectCrisisByRules(t);
      assert.ok(r.level === 'high' || r.level === 'medium', JSON.stringify(r));
      assert.equal(r.thirdParty, false, JSON.stringify(r));
    });
  }
  it('"muốn biến mất" alone is medium (ask directly), with "mãi mãi" is high', () => {
    assert.equal(detectCrisisByRules('mình chỉ muốn biến mất').level, 'medium');
    assert.equal(detectCrisisByRules('mình muốn biến mất mãi mãi').level, 'high');
  });
  it('"từ từ" (slowly) with diacritics is not "tự tử"', () => {
    assert.equal(detectCrisisByRules('từ từ rồi quen thôi').level, 'none');
    assert.equal(detectCrisisByRules('mình định tự tử').level, 'high');
    assert.equal(detectCrisisByRules('nhân vật trong phim tự tử ở tập cuối').level, 'none');
  });
});

describe('crisis detector – explicit negation lowers but keeps low', () => {
  it('negated ideation is low', () => {
    const r = detectCrisisByRules('mình không có ý định tự tử đâu, chỉ đang buồn thôi');
    assert.equal(r.level, 'low');
  });
});

describe('assessCrisis – classifier merge rules', () => {
  const mk = (level: RiskLevel, confidence = 0.9): CrisisClassifier => ({
    async classify() {
      return { level, confidence };
    },
  });

  it('rules high stays high even if classifier says none', async () => {
    const r = await assessCrisis('mình muốn chết', { classifier: mk('none'), skipClassifierOnHigh: false });
    assert.equal(r.level, 'high');
  });

  it('classifier can raise none -> medium', async () => {
    const r = await assessCrisis('mình ổn mà, chỉ là dạo này thấy mọi thứ nhạt, có hay không có mình cũng chẳng sao', { classifier: mk('medium') });
    assert.equal(r.level, 'medium');
    assert.equal(r.source, 'classifier');
  });

  it('confident classifier can clear a rules-low to none', async () => {
    const r = await assessCrisis('mình không có ý định tự tử đâu, chỉ đang buồn thôi', { classifier: mk('none', 0.95) });
    assert.equal(r.level, 'none');
  });

  it('classifier error does not reduce safety', async () => {
    const failing: CrisisClassifier = { async classify() { throw new Error('boom'); } };
    const r = await assessCrisis('sống để làm gì nữa', { classifier: failing });
    assert.equal(r.level, 'medium');
    assert.equal(r.source, 'rules');
  });
});
