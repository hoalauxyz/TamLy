# Sổ tay vận hành Lắng

Tài liệu này mô tả **toàn bộ** sản phẩm đúng như code đang chạy: ý tưởng, ranh giới, kiến trúc, thuật toán, dữ liệu, giao diện, cách chạy, cách kiếm tiền, và cách nâng cấp. Đọc file này trước khi sửa code.

- Phân tích thị trường / pháp lý: `docs/00-TONG-HOP-PHAN-TICH.md`
- Cách chạy nhanh: `README.md`
- Cập nhật: 17/09/2026 (bản chat-first)

---

## 1. Sản phẩm là gì

**Lắng** là app hỗ trợ sức khỏe tinh thần cho người trẻ Việt Nam (16–30). Thiết kế như **trợ lý AI trên điện thoại**: mở app là gặp An.

Một câu: *kể với An như kể với một người bạn; khi cần thì mở menu để check-in, kỹ năng, nhóm, sàng lọc, hoặc người thật.*

**An** hỏi han, phản ánh cảm xúc, nhớ chủ đề gần đây, gợi ý việc nhỏ, trò chuyện. An **không** phải bác sĩ, không chẩn đoán, không kê thuốc, không thay cấp cứu.

Bản hiện tại là **bản thử nghiệm**:

- Chat **miễn phí, không giới hạn** (`CHAT_DAILY_LIMIT=0`). Không phải dùng thử 7 ngày.
- Người vận hành **tự thông báo** người dùng rằng bản thử góp sức cải thiện An. App **không** nhắc đi nhắc lại trong khung chat.
- An nhớ cảm xúc/chủ đề của **chính người đó** trên máy + tóm tắt gửi vào pipeline.
- Hệ thống học **mẫu ẩn danh** (cảm xúc, chủ đề, ý định) — **máy chủ không lưu nguyên văn hội thoại**.
- Chuyên gia / người lắng nghe: hồ sơ minh họa. Đây là nguồn doanh thu sau (hoa hồng buổi), khi trải nghiệm “người bạn” đã ổn.

---

## 2. Việc được làm / không làm

### Được

- Trò chuyện tự nhiên, nhiều lượt, giọng “mình – bạn”.
- Giọng nói trên **web**: nói (Web Speech STT `vi-VN`) và An đọc (TTS). Native: TTS nếu có; STT chờ thêm.
- Nhận xét từ nhật ký (“tuần này nghiêng về mệt…”) — ngôn ngữ đời thường, không phải kết luận y khoa.
- Gợi ý nhỏ theo cảm xúc/chủ đề (`buildCompanionPlan`) — không phải liệu trình.
- Sàng lọc PHQ-9 / GAD-7 **tham khảo**.
- Kỹ năng 2–5 phút (CBT/ACT cơ bản đã kiểm duyệt).
- Nhóm theo hoàn cảnh sống, tiền kiểm duyệt.
- Banner quảng cáo trên web (**Cảm xúc / Cài đặt**), **không** trên khung chat, **không** chèn vào câu trả lời.
- Học cải thiện An bằng mẫu ẩn danh (mặc định bật `consent_improve`).

### Không làm (cố ý)

- Không nói “bạn bị trầm cảm / rối loạn X”.
- Không lưu nguyên văn chat trên server. Client gửi tối đa 24 tin gần nhất **theo từng request**; xong request là xong.
- Không fine-tune model công khai trên **nguyên văn** nhật ký hay chat. Lý do kỹ thuật: model sẽ bắt chước tuyệt vọng, học teencode tự hại, và có thể lộ chuyện người khác. Lý do pháp lý: dữ liệu sức khỏe là nhạy cảm (PDPL 91/2025).
- Không nhắm quảng cáo theo cảm xúc / nội dung hội thoại.
- Không giả An là người thật (Luật AI 134/2025 Điều 11).
- Không bỏ protocol khủng hoảng.
- Không cảnh báo lặp trong chat về “bạn đang dạy AI” — phần đó người vận hành nói với tester.

Cách An “ngày càng thông minh” (ba lớp, cố ý tách):

1. **Nhớ từng người (trên máy + tóm tắt):** check-in, `CompanionMemory` (emotion/topics/intensity), lịch sử chat local. Server nhận `contextSummary` đã rút gọn, không nhận nhật ký nguyên văn.
2. **Học hệ thống (thống kê):** mỗi lượt (trừ crisis cao) ghi `learn_events` **không có content** → admin xem pattern → chỉnh tay kịch bản/prompt.
3. **Sau này:** bộ dữ liệu đã người + chuyên gia duyệt, host model tại VN, mới được fine-tune. Cho đến lúc đó không có job train tự động.

---

## 3. Cấu trúc repo

```
TamLy/
  docs/                      Tài liệu
  packages/core/             Logic thuần TypeScript, có test — không phụ thuộc React/Node API
    src/safety/              Crisis detector + output guard
    src/ai/                  Prompt, kịch bản, pipeline 7 bước, LLM provider
    src/screening/           PHQ-9, GAD-7
    src/content/             Kỹ năng, nhóm, hồ sơ người hỗ trợ (minh họa)
    src/moderation/          Tiền kiểm duyệt bài nhóm
    src/crisis/              Hotline
    src/learn/               Memory + companion plan + học mẫu ẩn danh + AD_POLICY
    src/text/                Chuẩn hóa tiếng Việt, teencode
  apps/api/                  Fastify + SQLite (node:sqlite)
  apps/mobile/               Expo Router (iOS / Android / web), giao diện ~480px
```

Nguyên tắc: **mọi quyết định an toàn nằm ở `packages/core`**, có test (~101). API và app chỉ gọi, không tự bịa logic khủng hoảng.

---

## 4. Luồng người dùng (chat là chủ đạo)

Mở app = **trò chuyện với An**. Khung tối đa ~480px (vỏ điện thoại trên web: `PhoneShell` trong `_layout.tsx`). Tab bar **ẩn**. Mọi tính năng khác nằm trong sidebar ☰.

```
Onboarding → màn An (chat)
                 │
                 ├─ 🎤 nói / 🔊 nghe (web)
                 ├─ 🆘 khẩn cấp
                 └─ ☰ menu ẩn
                       ├─ Cảm xúc hôm nay     /journal
                       ├─ Kỹ năng ngắn        /(tabs)/skills
                       ├─ Nhóm chia sẻ        /(tabs)/groups
                       ├─ Kiểm tra nhanh      /screening/phq9
                       ├─ Người hỗ trợ        /experts
                       ├─ Cài đặt             /(tabs)/more
                       └─ Cần hỗ trợ ngay     /crisis
```

1. Onboarding 3 slide (An là màn chính; không chẩn đoán; dữ liệu trên máy) → biệt danh → bật AI (mặc định bật) → xác nhận từ 16 tuổi + An không phải tư vấn y khoa.
2. Màn chính: chào theo giờ + biệt danh, chip mở đầu (“Mình đang lo”, “Hôm nay mệt quá”…). Gõ hoặc nói. An trả lời bằng kịch bản (hoặc LLM nếu đã cấu hình). Sau vài lượt hiện **gợi ý nhỏ** từ `buildCompanionPlan`. Nút **Mới** xóa phiên local.
3. Crisis high → thẻ cố định + hotline, ngắt LLM, không ghi `learn_events`.
4. Menu → Cảm xúc: check-in 30 giây (emoji + tag + ghi chú tùy chọn), xu hướng 7 ngày, gợi ý PHQ/GAD. Banner đối tác (web) **ở đây**, không trong chat.
5. Menu → Kỹ năng (10 bài offline), Nhóm (5 nhóm, `preModeratePost`), Người hỗ trợ (đặt lịch disabled), Cài đặt (consent AI, xuất/xóa dữ liệu). Mỗi màn phụ có **← Trò chuyện với An**.

Nút **Cần hỗ trợ ngay** luôn có.

---

## 5. Thuật toán An (pipeline 7 bước)

File: `packages/core/src/ai/pipeline.ts` — hàm `runChatTurn`.

```
tin nhắn + history (tối đa 24, do client gửi)
  → [1] chuẩn hóa (bỏ dấu, teencode)     text/normalize.ts
  → [2] crisis luật (<5ms)               safety/crisisDetector.ts + crisisRules.ts
        high  → dừng, crisis card, không LLM
  → [3] crisis classifier (nếu có LLM)   có thể nâng none→medium; không được hạ high
  → [4] intent + emotion                 ai/intent.ts (luật; LLM tinh chỉnh venting/unclear)
  → [5] sinh câu trả lời
        greeting / hỏi triệu chứng / muốn người thật / kỹ thuật / hỏi app → kịch bản
        giãi bày / không rõ / check-in → LLM nếu có, không thì kịch bản
        contextSummary (nhật ký đã rút) được nhét vào prompt hoặc câu nhớ
  → [6] output guard                     safety/outputGuard.ts
        chặn chẩn đoán, tên thuốc, chi tiết phương pháp, “giữ bí mật”
  → [7] trả lời + sự kiện an toàn        risk, intent, strategy, prompt_version
```

`preferLlmForVenting: true` ở API: ưu tiên LLM khi người dùng đang kể chuyện (vẫn **sau** crisis + guard).

Chế độ **không LLM** (chưa điền `LLM_*` hoặc kill-switch): An vẫn chạy bằng kịch bản trong `ai/scripts.ts` (phản ánh cảm xúc + câu hỏi mở). App **offline fallback**: nếu API chết, `(tabs)/index.tsx` gọi `runChatTurn` ngay trên máy.

System prompt: `ai/systemPrompt.ts`, phiên bản `PROMPT_VERSION`.

API **không INSERT** vào `chat_messages`. Body chat gồm `history` từ local. `GET /v1/chat/history` luôn `[]`.

---

## 6. Crisis detector

File: `safety/crisisRules.ts` + `crisisDetector.ts`.

- Luật có trọng số, tiếng Việt có dấu / không dấu / teencode.
- Loại idiom (“chán chết đi được”, “deadline giết mình”).
- Phủ định làm giảm điểm nhưng không xóa hết.
- Người thứ ba (“bạn mình muốn chết”) → thẻ khác, không xử như tự hại của chính user.
- Ngưỡng: `CRISIS_THRESHOLDS` trong detector.
- PHQ-9 câu 9 > 0 → cờ an toàn dù tổng điểm thấp.

Khi high: API **không lưu nguyên văn** (trừ `STORE_CRISIS_TEXT=1`). UI hiện `CrisisCardView` + `CRISIS_RESOURCES`. Hotline Ngày Mai đang `needs_verification` — phải gọi xác minh trước launch. Crisis **không** bị hạn mức chat chặn.

Test: `packages/core/test/crisis.test.ts` — không được giảm recall nhóm HIGH khi sửa luật.

---

## 7. Học và nhớ

File: `packages/core/src/learn/memory.ts`. Client: `apps/mobile/src/lib/store.ts`.

### 7.1 Nhớ từng người (không phải lưu mọi cuộc chat trên server)

| Lớp | Ở đâu | Nội dung |
|---|---|---|
| Chat local | AsyncStorage `lang.chat.messages` | tối đa 80 tin, chỉ để hiện UI và gửi `history` theo request |
| Companion memory | AsyncStorage `lang.companion` | emotion, topics, intensity, updatedAt — **không** nguyên văn |
| Check-in | local + bản sao server (mood/tags) | điểm 1–5, tag; note local; server dùng để tóm tắt, không nhồi note vào model |
| `contextSummary` | tính mỗi request | “Check-in n ngày… hay gắn Học tập”. Không chứa nguyên văn. |
| `buildCompanionPlan` | core, hiện dưới khung chat | 2–3 gợi ý nhẹ + skillId; `expertHint` khi intensity high |

API mỗi lượt chat:

1. Nhận `history` từ client (đã lọc role user/assistant, cắt 24 tin, cắt 2000 ký tự/tin).
2. Lấy 14 check-in + 20 `learn_events` gần nhất → `buildContextSummary` (cố ý **bỏ note**).
3. `runChatTurn`.
4. Tăng `chat_quota`. Ghi `safety_events` nếu có.
5. Nếu `consent_improve` và risk ≠ high: INSERT `learn_events` (không content). Cập nhật `session_summaries` bằng đoạn tóm tắt, không transcript.

Màn Cảm xúc: `describeMoodTrend(checkins)` — kết thúc “không phải chẩn đoán”.

### 7.2 Học hệ thống (ẩn danh)

Bảng `learn_events`: `at, user_id, intent, emotion, intensity, topics, risk_level, strategy`. **Không có content.**

Bảng `session_summaries`: tóm tắt phiên (cũng không phải transcript).

Admin: `GET /v1/admin/learn/patterns` (header `x-admin-token`) → tần suất cảm xúc/chủ đề/ý định 30 ngày. Dùng để:

- Thêm kịch bản cho chủ đề đang hot (ví dụ “năm nhất xa nhà”).
- Chỉnh prompt An.
- **Không** train model tự động từ endpoint này.

Crisis high không ghi `learn_events`.

### 7.3 Fine-tune sau này (chưa code)

Chỉ khi: (a) có cố vấn lâm sàng, (b) mẫu đã gán nhãn + khử PII, (c) host model trong nước, (d) không gồm hội thoại crisis. Cho đến lúc đó, “học” = memory + pattern + chỉnh tay kịch bản + (sau này) RAG trên tài liệu tâm lý đã duyệt.

---

## 8. Dữ liệu

SQLite dev: `apps/api/data/tamly.dev.sqlite` (hoặc `DB_PATH`). Production: PostgreSQL cùng schema, mã hóa at-rest.

| Bảng | Việc |
|---|---|
| `users` | Pseudonymous id, biệt danh, `consent_llm`, `consent_research`, `consent_improve` (mặc định 1) |
| `checkins` | mood 1–5, tags JSON, note |
| `screenings` | answers, total, band, safety_flag |
| `chat_messages` | **không còn INSERT**; bảng giữ để dọn dữ liệu cũ / export rỗng |
| `safety_events` | sự cố; mặc định không lưu nguyên văn |
| `groups` / `posts` | nhóm + bài có `status` |
| `chat_quota` | số tin / ngày (`limit = 0` → đếm nhưng không chặn) |
| `learn_events` | mẫu học ẩn danh (cảm xúc, chủ đề, ý định — không content) |
| `session_summaries` | tóm tắt phiên (cũng không phải transcript) |

Auth MVP: header `x-user-id` do máy tạo. Beta: OTP / Apple / Google; **tách** bảng auth khỏi bảng tâm lý.

Xóa tài khoản: `DELETE /v1/me` + `wipeLocalData()`. Safety events khử id (`erased`), không xóa hết (Luật AI — hồ sơ sự cố).

Trên máy: `getLocalChat` / `setCompanionMemory` / check-in. Xuất dữ liệu server **không** gồm transcript (mảng chat rỗng).

---

## 9. API

Base: `http://localhost:3000`. Mọi `/v1/*` (trừ health, ads, skills, crisis-resources, groups list, support) cần `x-user-id`.

| Method | Đường | Việc |
|---|---|---|
| GET | `/health` | llm mode |
| POST/GET/DELETE | `/v1/me` | hồ sơ, consent, xóa |
| GET | `/v1/me/export` | xuất dữ liệu (chat = []) |
| POST/GET | `/v1/checkins` | check-in |
| POST/GET | `/v1/screenings` | sàng lọc |
| POST | `/v1/chat` | một lượt An. Body: `{ sessionId, message, acknowledgedCrisis?, history? }`. Trả `reply`, `suggestions`, `analysis`, `quota` (`limit: 0` = không giới hạn) |
| GET | `/v1/chat/history` | **luôn `[]`** — lịch sử chỉ trên máy |
| GET | `/v1/crisis-resources` | hotline |
| GET | `/v1/skills` | thư viện |
| GET | `/v1/support` | người hỗ trợ (minh họa) |
| GET | `/v1/ads` | cấu hình banner + `AD_POLICY` |
| GET/POST | `/v1/groups…` | nhóm + đăng bài |
| GET | `/v1/admin/safety-events` | Safety Ops |
| GET | `/v1/admin/learn/patterns` | pattern học |
| GET | `/v1/admin/metrics` | KPI 7 ngày |

Admin: `x-admin-token`. Token mặc định `change-me` → 403 (bắt đổi).

---

## 10. App (Expo) — UI/UX

`apps/mobile/src/app/` — file-based routing. Cảm giác: **ấm, hiện đại, như một người bạn** — nền be `#F4EFE6`, chữ nâu, nhấn xanh lá dịu, khẩn cấp cam đất (không đỏ chói). Bảng màu: `lib/theme.ts`.

| File | Việc |
|---|---|
| `_layout.tsx` | Onboarding gate + `PhoneShell` maxWidth 480 |
| `(tabs)/_layout.tsx` | `tabBarStyle: display none`; tab phụ `href: null` |
| `(tabs)/index.tsx` | **Màn chính = chat An** (hamburger, avatar 🌿, mic, loa, gửi) |
| `(tabs)/chat.tsx` | Redirect về `/(tabs)` |
| `components/Sidebar.tsx` | Overlay menu ẩn |
| `lib/voice.ts` | STT/TTS web `vi-VN` |
| `journal.tsx` | Check-in (cũ là trang chủ) |
| `onboarding.tsx` | 3 slide + biệt danh; consent LLM mặc định bật |
| `experts.tsx` | `PLACEHOLDER_SUPPORT`, nút đặt lịch disabled |
| `components/ui.tsx` | `BackToAn`, `AdBanner` (web only), `CrisisCardView`, `Disclaimer` |

Local-first: AsyncStorage. Chat/nhóm/sàng lọc chạy được khi API chết.

`expo.extra.apiBaseUrl` trong `app.json`. Android emulator: client đổi `localhost` → `10.0.2.2`.

---

## 11. Quảng cáo, chuyên gia, tiền

**Giai đoạn thử (hiện tại):** chat miễn phí không giới hạn để người dùng coi An như chỗ kể chuyện. Banner web trên **Cảm xúc / Cài đặt**. `AdBanner` chỉ render trên web. Copy cố định trong `AD_POLICY`, **không** đọc mood/chat.

Tắt: `ADS_ENABLED=0`.

Không được: chèn QC vào bubble của An; bán data; pixel quảng cáo nhận transcript.

**Giai đoạn sau** (khi có người dùng thật):

1. Gói trường / doanh nghiệp (Kooth-style) — ưu tiên.
2. **Hoa hồng buổi chuyên gia 15–20%** — ghép người phù hợp từ sàng lọc + chủ đề (không phải chẩn đoán). Nút “Đặt lịch” sẽ mở khi đã xác minh giấy phép.
3. Premium: người lắng nghe / LLM khi sau này có hạn mức.
4. Tài trợ nghiên cứu trên mẫu ẩn danh (không transcript).

Chuyên gia trong app hiện là **hồ sơ minh họa** (`PLACEHOLDER_SUPPORT`). Việc nặng / kéo dài: An gợi ý gặp người thật, không tự điều trị.

---

## 12. Biến môi trường

Xem `apps/api/.env.example`.

| Biến | Mặc định | Việc |
|---|---|---|
| `PORT` / `HOST` | 3000 / 0.0.0.0 | API |
| `DB_PATH` | `./data/tamly.dev.sqlite` | SQLite |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | trống | OpenAI-compatible; trống = chỉ kịch bản |
| `LLM_DISABLED` | 0 | kill-switch |
| `CHAT_DAILY_LIMIT` | **0** | 0 = không giới hạn; crisis không bị chặn |
| `ADMIN_TOKEN` | change-me | Safety Ops |
| `STORE_CRISIS_TEXT` | 0 | lưu nguyên văn crisis |
| `CHAT_RETENTION_DAYS` | 30 | dọn hàng `chat_messages` cũ (API không còn ghi transcript) |
| `ADS_ENABLED` | 1 | banner web ngoài khung chat |

---

## 13. Chạy, test, nâng cấp

```bash
npm install          # Node ≥ 22.12
npm test             # packages/core (node:test) — ~101 test
npm run typecheck
npm run api          # :3000
npm run mobile:web   # :8081 (Expo)
```

Thêm hành vi An: sửa `scripts.ts` hoặc `systemPrompt.ts`, bump `PROMPT_VERSION`, thêm test.

Thêm luật crisis: `crisisRules.ts` + case trong `crisis.test.ts`. Recall HIGH không được giảm.

Thêm kỹ năng: `content/skills.ts`.

Đổi hotline: `crisis/resources.ts` **và** nguồn remote (chưa làm) — đừng hardcode số chết.

Học pattern mới: xem `/v1/admin/learn/patterns`, rồi sửa kịch bản — không viết job fine-tune cho đến khi có bộ mẫu đã duyệt.

Giọng nói native: thay `lib/voice.ts` (hiện Web Speech). Đừng đưa audio lên server.

---

## 14. Việc chưa làm (để người sau biết)

- Auth thật (OTP/Apple/Google) + tách kho định danh.
- PostgreSQL + encryption at rest + SecureStore.
- Safety Ops UI (hiện chỉ API).
- Gọi xác minh hotline; remote config.
- Đặt lịch chuyên gia thật + thuật toán ghép (doanh thu).
- Moderators nhóm (SV tâm lý).
- Pixel/SDK quảng cáo thật (khi có: page-level only, không mood targeting).
- STT native (iOS/Android).
- RAG trên tài liệu tâm lý đã duyệt (không train trên chat thô).
- Fine-tune in-country.
- Điều khoản / privacy URL thật (hiện example.com).

---

## 15. Liên hệ file với câu hỏi “vì sao code thế này”

| Muốn hiểu | Mở |
|---|---|
| An trả lời thế nào | `packages/core/src/ai/pipeline.ts`, `scripts.ts`, `systemPrompt.ts` |
| Làm sao phát hiện khủng hoảng | `safety/crisisDetector.ts`, `crisisRules.ts` |
| Chat là màn chính | `apps/mobile/src/app/(tabs)/index.tsx`, `Sidebar.tsx`, `(tabs)/_layout.tsx` |
| Giọng nói | `apps/mobile/src/lib/voice.ts` |
| An nhớ / lập gợi ý | `learn/memory.ts` (`buildContextSummary`, `buildCompanionPlan`), `lib/store.ts` |
| Vì sao server không có lịch sử chat | `apps/api/src/routes.ts` POST `/v1/chat` (comment “Không lưu nguyên văn”); GET history trả `[]` |
| An “học” hệ thống | bảng `learn_events`, `GET /v1/admin/learn/patterns` |
| Vì sao không train trên chat thô | mục 2 và 7.3 tài liệu này |
| Quảng cáo | `AD_POLICY` trong `learn/memory.ts`, `AdBanner` trong `components/ui.tsx` |
| Schema | `apps/api/src/db.ts` |
| Màn hình | `apps/mobile/src/app/**` |
